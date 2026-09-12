import React, { useState, useEffect, useRef } from 'react';
import { Player } from '@remotion/player';
import { SongStoryVideoComposition } from '../video/SongStoryVideoComposition';
import {
  X, Upload, Trash2, Video, Sparkles, Download, AlertCircle, Plus, Wand2, Clock,
  GripVertical, ChevronUp, ChevronDown, Image as ImageIcon
} from 'lucide-react';
import Sparkle from './Sparkle';
import { generateSongLyrics } from '../utils/lyricsGenerator';
import { buildVideoFilename } from '../utils/filenameBuilder';

const DEFAULT_PHOTO_DURATION_SEC = 4;
const MIN_TRIM_GAP_SEC = 1;
const FPS = 30;
// Fallback only for songs that predate per-plan upload budgets — real songs
// always carry their own song.maxUploadBytes from the plan (50MB Trio / 90MB
// Quinteto), which is also Cloudflare's own edge request-size ceiling.
const FALLBACK_UPLOAD_BUDGET_BYTES = 90 * 1024 * 1024;

// One effective duration helper for both media types — a video's is whatever's
// left after trimming; a photo's is just whatever the customer set it to.
const itemDuration = (item) =>
  item.type === 'video'
    ? Math.max(0, (item.trimEnd ?? item.fullDurationSec ?? 0) - (item.trimStart ?? 0))
    : item.durationSec || 0;

const formatClock = (secs) => {
  const s = Math.max(0, Math.round(secs));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? '0' : ''}${r}`;
};

export default function SongVideoCreatorModal({
  isOpen,
  onClose,
  song,
  accessCode,
  onVideoReady
}) {
  // How many photos/clips this song's plan allows per video, how many
  // independent finished videos it can have at once, and the combined upload
  // budget per video creation — falls back to generous defaults for songs
  // that predate these per-plan limits.
  const maxPhotos = song?.maxPhotos ?? 5;
  const maxVideoClips = song?.maxVideoClips ?? song?.maxVideos ?? 2;
  const maxVideoProjects = song?.maxVideoProjects ?? 1;
  const maxUploadBytes = song?.maxUploadBytes ?? FALLBACK_UPLOAD_BUDGET_BYTES;

  // This song's own already-finished videos. Read straight from the `song` prop
  // rather than mirrored local state, so it always reflects whatever the parent
  // just patched in after a render finishes.
  const existingVideos = Array.isArray(song?.videos)
    ? song.videos
    : song?.videoUrl
      ? [{ url: song.videoUrl, expiresAt: song.videoExpiresAt }]
      : [];
  // maxVideoProjects is spent per ACCOUNT, not per song — a customer can put
  // both of their plan's video slots on the same song, or split them across
  // different ones. accountVideosUsed is that account-wide running total.
  const accountVideosUsed = song?.accountVideosUsed ?? existingVideos.length;
  const canCreateMoreVideos = accountVideosUsed < maxVideoProjects;

  // ONE ordered timeline the customer arranges themselves — photos and videos
  // mixed freely, in whatever order they drag/move them into. Each item:
  // photo:  { id, type:'photo', url, file?, durationSec }
  // video:  { id, type:'video', url, file, fullDurationSec, trimStart, trimEnd }
  const [mediaItems, setMediaItems] = useState([]);
  const nextIdRef = useRef(1);
  const dragIndexRef = useRef(null);

  // Which trim handle ('start'|'end') was touched most recently, per item id —
  // used so that when the two trim thumbs visually overlap, the one the user
  // is actually dragging stays on top instead of whichever is later in the DOM.
  const [activeTrimHandle, setActiveTrimHandle] = useState({});

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [lyricsText, setLyricsText] = useState('');

  // Real per-word timestamps from ElevenLabs for the song's ACTUAL lyrics (when the
  // song was generated after this feature shipped). Only trustworthy as long as the
  // user hasn't hand-edited the text below, since editing breaks the word alignment.
  const [realLyricsLines, setRealLyricsLines] = useState([]);
  const [isLyricsEdited, setIsLyricsEdited] = useState(false);
  const hasRealLyrics = realLyricsLines.length > 0;

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState('');
  const [exportQueuePosition, setExportQueuePosition] = useState(0);
  const pollIntervalRef = useRef(null);

  // Seed the form once per distinct song, keyed by filename rather than object
  // identity — a song can now finish a video mid-session, which patches the
  // `song` prop with a new object reference, and that must NOT wipe out the
  // title/subtitle/lyrics the customer already typed for a second video.
  const seededFilenameRef = useRef(null);
  useEffect(() => {
    if (song && song.filename !== seededFilenameRef.current) {
      seededFilenameRef.current = song.filename;

      const cleanName = (song.names || '').replace(/^(para|con amor para|dedicada a)\s+/i, '').trim() || 'Alguien especial';
      setTitle(`Para ${cleanName}`);
      setSubtitle(`${song.style || 'Canción Personalizada'} • Canción Oficial`);
      setIsLyricsEdited(false);

      // Seed a couple of sample photos for this song — flagged `isPlaceholder`
      // so the UI can make clear these are examples to replace, not real content.
      const seedUrls = ['/images/hero-vocalista.avif', '/images/demo-pedida-novia.avif'].slice(0, song.maxPhotos ?? 5);
      setMediaItems(
        seedUrls.map((url) => ({
          id: nextIdRef.current++,
          type: 'photo',
          url,
          durationSec: DEFAULT_PHOTO_DURATION_SEC,
          isPlaceholder: true
        }))
      );

      if (Array.isArray(song.lyricsLines) && song.lyricsLines.length > 0) {
        setRealLyricsLines(song.lyricsLines);
        setLyricsText(song.lyricsLines.map((l) => l.text).join('\n'));
      } else {
        setRealLyricsLines([]);
        const generatedVerses = generateSongLyrics({
          names: song.names,
          references: song.references,
          style: song.style
        });
        setLyricsText(generatedVerses.join('\n'));
      }
    }
  }, [song]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  if (!isOpen || !song) return null;

  // Parse lyrics into array
  const parsedLyrics = lyricsText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const usingRealTiming = hasRealLyrics && !isLyricsEdited;

  // Video configuration
  const durationInSeconds = Math.max(15, Math.min(song.duration || 30, 180));
  const durationInFrames = durationInSeconds * FPS;

  const photoCount = mediaItems.filter((m) => m.type === 'photo').length;
  const videoCount = mediaItems.filter((m) => m.type === 'video').length;
  const uploadedBytes = mediaItems.reduce((sum, m) => sum + (m.file?.size || 0), 0);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const room = maxPhotos - photoCount;
    let runningTotal = uploadedBytes;
    const toAdd = [];
    for (const file of files.slice(0, room)) {
      if (runningTotal + file.size > maxUploadBytes) {
        setExportError(`No se pudo agregar "${file.name}": el total de fotos y videos superaría el límite de ${(maxUploadBytes / (1024 * 1024)).toFixed(0)}MB combinados de tu plan.`);
        break;
      }
      runningTotal += file.size;
      toAdd.push({
        id: nextIdRef.current++,
        type: 'photo',
        url: URL.createObjectURL(file),
        file,
        durationSec: DEFAULT_PHOTO_DURATION_SEC
      });
    }
    setMediaItems((prev) => [...prev, ...toAdd]);
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const room = maxVideoClips - videoCount;
    const toAdd = files.slice(0, room);
    let runningTotal = uploadedBytes;

    for (const file of toAdd) {
      if (runningTotal + file.size > maxUploadBytes) {
        setExportError(`No se pudo agregar "${file.name}": el total de fotos y videos superaría el límite de ${(maxUploadBytes / (1024 * 1024)).toFixed(0)}MB combinados de tu plan.`);
        continue;
      }
      runningTotal += file.size;
      const url = URL.createObjectURL(file);
      const probe = document.createElement('video');
      probe.preload = 'metadata';
      probe.onloadedmetadata = () => {
        // Starts fully un-trimmed (whole clip used) — the trim sliders below let
        // the user pick which part to actually use, like trimming a video before
        // sharing it on WhatsApp.
        setMediaItems((prev) => [
          ...prev,
          { id: nextIdRef.current++, type: 'video', url, file, fullDurationSec: probe.duration, trimStart: 0, trimEnd: probe.duration }
        ]);
      };
      probe.onerror = () => {
        URL.revokeObjectURL(url);
        setExportError(`No se pudo leer el video "${file.name}".`);
      };
      probe.src = url;
    }
  };

  const handleRemoveItem = (id) => {
    setMediaItems((prev) => {
      const item = prev.find((m) => m.id === id);
      if (item?.file) URL.revokeObjectURL(item.url);
      return prev.filter((m) => m.id !== id);
    });
  };

  const handleMoveItem = (id, direction) => {
    setMediaItems((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      const newIdx = idx + direction;
      if (idx === -1 || newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const handleDragStart = (idx) => {
    dragIndexRef.current = idx;
  };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (idx) => {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from === null || from === idx) return;
    setMediaItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(idx, 0, moved);
      return next;
    });
  };

  const handlePhotoDurationChange = (id, value) => {
    const seconds = Math.max(1, Math.min(60, parseInt(value, 10) || 1));
    setMediaItems((prev) => prev.map((m) => (m.id === id ? { ...m, durationSec: seconds } : m)));
  };

  const handleTrimChange = (id, which, value) => {
    setMediaItems((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const seconds = Math.max(0, Math.min(m.fullDurationSec, parseFloat(value) || 0));
        if (which === 'start') {
          return { ...m, trimStart: Math.min(seconds, m.trimEnd - MIN_TRIM_GAP_SEC) };
        }
        return { ...m, trimEnd: Math.max(seconds, m.trimStart + MIN_TRIM_GAP_SEC) };
      })
    );
  };

  const totalContentDurationSec = mediaItems.reduce((sum, m) => sum + itemDuration(m), 0);
  const willLoop = totalContentDurationSec > 0 && totalContentDurationSec < durationInSeconds - 0.5;
  const totalVideoDurationSec = mediaItems.filter((m) => m.type === 'video').reduce((sum, m) => sum + itemDuration(m), 0);

  const timeline = mediaItems.reduce((acc, m) => {
    const start = acc.length > 0 ? acc[acc.length - 1].end : 0;
    acc.push({ start, end: start + itemDuration(m) });
    return acc;
  }, []);

  // Converts a media item into a real File to upload: an uploaded item already
  // has its original File cached; a preset image (a plain /images/... path)
  // gets fetched and wrapped into one on the spot.
  const itemToFile = async (item) => {
    if (item.file) return item.file;
    const blob = await fetch(item.url).then((r) => r.blob());
    const ext = (blob.type.split('/')[1] || 'jpg').split('+')[0];
    return new File([blob], `photo.${ext}`, { type: blob.type });
  };

  // The actual video is rendered server-side (headless Chromium via Remotion) —
  // real duration songs take several minutes, so this kicks off a background job
  // and polls for progress instead of blocking on a single request.
  const handleExportVideo = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportQueuePosition(0);
    setExportError('');

    try {
      if (!canCreateMoreVideos) {
        throw new Error(`Tu plan permite crear hasta ${maxVideoProjects} video(s) en total para tu cuenta, y ya has creado ${accountVideosUsed}. Espera a que uno expire (14 días) para crear otro.`);
      }
      if (mediaItems.length === 0) {
        throw new Error('Agrega al menos una foto o un video.');
      }
      if (totalVideoDurationSec > durationInSeconds) {
        throw new Error(
          `La suma de tus videos (${Math.round(totalVideoDurationSec)}s) no puede superar la duración de la canción (${Math.round(durationInSeconds)}s).`
        );
      }
      if (uploadedBytes > maxUploadBytes) {
        throw new Error(`El total de fotos y videos supera el límite de ${(maxUploadBytes / (1024 * 1024)).toFixed(0)}MB combinados de tu plan. Reduce el tamaño o la cantidad de archivos.`);
      }

      const photoItems = mediaItems.filter((m) => m.type === 'photo');
      const videoItems = mediaItems.filter((m) => m.type === 'video');
      const photoFiles = await Promise.all(photoItems.map(itemToFile));

      const formData = new FormData();
      formData.append('code', accessCode);
      formData.append('filename', song.filename);
      formData.append('title', title);
      formData.append('subtitle', subtitle);
      formData.append('lyrics', JSON.stringify(parsedLyrics));
      if (usingRealTiming) formData.append('lyricsLines', JSON.stringify(realLyricsLines));
      if (photoItems.length > 0) {
        formData.append('photoDurationsSec', JSON.stringify(photoItems.map((p) => p.durationSec)));
      }
      photoFiles.forEach((file) => formData.append('photos', file));
      videoItems.forEach((v) => formData.append('videos', v.file));
      if (videoItems.length > 0) {
        formData.append('videoTrims', JSON.stringify(videoItems.map((v) => ({ start: v.trimStart, end: v.trimEnd }))));
      }
      // The customer's chosen playback order, referencing each file's position
      // within the `photos`/`videos` upload arrays above.
      formData.append(
        'mediaOrder',
        JSON.stringify(
          mediaItems.map((m) =>
            m.type === 'photo'
              ? { type: 'photo', fileIndex: photoItems.indexOf(m) }
              : { type: 'video', fileIndex: videoItems.indexOf(m) }
          )
        )
      );

      const res = await fetch('/api/video/render', {
        method: 'POST',
        body: formData
      });
      // A request rejected upstream of our server (e.g. Cloudflare's own request
      // size cap) comes back as an HTML error page, not JSON — parsing that as
      // JSON would throw and hide the real, more useful message below.
      let data;
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok || !data.jobId) {
        if (res.status === 413) {
          throw new Error('El total de fotos y videos es demasiado pesado para subir. Reduce el tamaño o la cantidad de archivos.');
        }
        throw new Error(data.error || 'No se pudo iniciar la generación del video.');
      }

      const jobId = data.jobId;
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/video/render/${jobId}/status`);
          const statusData = await statusRes.json();

          if (!statusRes.ok) {
            throw new Error(statusData.error || 'Error consultando el estado del video.');
          }

          setExportProgress(Math.round((statusData.progress || 0) * 100));
          setExportQueuePosition(statusData.status === 'queued' ? statusData.queuePosition : 0);

          if (statusData.status === 'done') {
            clearInterval(pollIntervalRef.current);
            setIsExporting(false);
            if (onVideoReady) onVideoReady(song.filename, statusData.videoUrl, statusData.videoExpiresAt);
          } else if (statusData.status === 'failed') {
            clearInterval(pollIntervalRef.current);
            setIsExporting(false);
            setExportError(statusData.error || 'No se pudo generar el video.');
          }
        } catch (pollErr) {
          clearInterval(pollIntervalRef.current);
          setIsExporting(false);
          setExportError(pollErr.message || 'Error consultando el estado del video.');
        }
      }, 3000);
    } catch (err) {
      console.error(err);
      setExportError(err.message || 'Hubo un error al generar el video.');
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/90 backdrop-blur-2xl animate-fadeIn overflow-y-auto">
      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-w-5xl my-auto bg-[#0a0d1d] border border-pink-500/30 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[100dvh] sm:max-h-[95vh]">

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-800 flex items-center justify-between bg-[#0e1228]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-900/40 flex-shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                <span>Creador de Video Vertical (9:16)</span>
                <Sparkle className="w-3.5 h-3.5 text-pink-400" animation="animate-twinkle" />
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Convierte la canción de <strong>{song.names}</strong> en un video para Estados de WhatsApp, Instagram Reels o TikTok con fotos{maxVideoClips > 0 ? ', videos' : ''} y letra.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isExporting && !window.confirm('Tu video se sigue generando en el servidor, pero perderás esta pantalla de progreso. ¿Cerrar de todas formas?')) {
                return;
              }
              onClose();
            }}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Split: Editor (Left) & Remotion Live Preview (Right) */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto flex-1">

          {/* LEFT COLUMN: Controls & Timeline (7 cols) */}
          <div className="lg:col-span-7 space-y-6">

            {/* Unified, reorderable timeline of photos + videos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-pink-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Fotos y Videos — arrastra o usa las flechas para ordenar</span>
                </label>
                <span className={`text-[11px] font-mono ${uploadedBytes > maxUploadBytes * 0.9 ? 'text-amber-400' : 'text-gray-400'}`}>
                  {photoCount}/{maxPhotos} fotos · {videoCount}/{maxVideoClips} videos · {(uploadedBytes / (1024 * 1024)).toFixed(0)}/{(maxUploadBytes / (1024 * 1024)).toFixed(0)}MB
                </span>
              </div>

              <div className="space-y-2 mb-2">
                {mediaItems.map((item, idx) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(idx)}
                    className="p-2.5 rounded-xl bg-gray-950/60 border border-purple-500/30 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="cursor-grab active:cursor-grabbing text-gray-500 flex-shrink-0" title="Arrastra para reordenar">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      <div className="relative flex-shrink-0">
                        {item.type === 'photo' ? (
                          <img src={item.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <video src={item.url} className="w-12 h-12 rounded-lg object-cover" muted />
                        )}
                        {item.isPlaceholder && (
                          <span className="absolute -bottom-1 -right-1 px-1 py-0.5 rounded bg-amber-500 text-gray-950 text-[8px] font-bold leading-none shadow">
                            Ejemplo
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-1 ${
                              item.type === 'photo' ? 'bg-pink-950/60 text-pink-300' : 'bg-purple-950/60 text-purple-300'
                            }`}
                          >
                            {item.type === 'photo' ? <ImageIcon className="w-2.5 h-2.5" /> : <Video className="w-2.5 h-2.5" />}
                            {item.type === 'photo' ? 'FOTO' : 'VIDEO'}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">#{idx + 1}</span>
                        </div>
                        {timeline[idx] && (
                          <p className="text-[10px] font-mono font-semibold text-pink-300 mt-0.5">
                            Aparece: {formatClock(timeline[idx].start)} – {formatClock(timeline[idx].end)}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveItem(item.id, -1)}
                          disabled={idx === 0}
                          className="p-2.5 -m-1 text-gray-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Mover antes"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveItem(item.id, 1)}
                          disabled={idx === mediaItems.length - 1}
                          className="p-2.5 -m-1 text-gray-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Mover después"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 flex-shrink-0"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {item.type === 'photo' ? (
                      <div className="flex items-center gap-1.5 pl-7">
                        <span className="text-[10px] text-gray-400">Duración:</span>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={item.durationSec}
                          onChange={(e) => handlePhotoDurationChange(item.id, e.target.value)}
                          className="w-16 px-2 py-1 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-pink-500"
                        />
                        <span className="text-[10px] text-gray-500">seg</span>
                      </div>
                    ) : (
                      item.fullDurationSec > MIN_TRIM_GAP_SEC && (
                        <div className="px-1">
                          <p className="text-[10px] text-gray-400 mb-1">
                            Recorte: {itemDuration(item).toFixed(1)}s de {item.fullDurationSec.toFixed(1)}s — elige qué parte usar, como al recortar un video en WhatsApp
                          </p>
                          <div className="relative h-6 flex items-center">
                            <div className="absolute left-0 right-0 h-1.5 bg-gray-800 rounded-full" />
                            <div
                              className="absolute h-1.5 bg-pink-500 rounded-full"
                              style={{
                                left: `${(item.trimStart / item.fullDurationSec) * 100}%`,
                                right: `${100 - (item.trimEnd / item.fullDurationSec) * 100}%`
                              }}
                            />
                            <input
                              type="range"
                              min={0}
                              max={item.fullDurationSec}
                              step={0.1}
                              value={item.trimStart}
                              onChange={(e) => handleTrimChange(item.id, 'start', e.target.value)}
                              onMouseDown={() => setActiveTrimHandle((prev) => ({ ...prev, [item.id]: 'start' }))}
                              onTouchStart={() => setActiveTrimHandle((prev) => ({ ...prev, [item.id]: 'start' }))}
                              className={`absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pink-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-pink-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer ${
                                activeTrimHandle[item.id] === 'end' ? 'z-[1]' : 'z-[2]'
                              }`}
                            />
                            <input
                              type="range"
                              min={0}
                              max={item.fullDurationSec}
                              step={0.1}
                              value={item.trimEnd}
                              onChange={(e) => handleTrimChange(item.id, 'end', e.target.value)}
                              onMouseDown={() => setActiveTrimHandle((prev) => ({ ...prev, [item.id]: 'end' }))}
                              onTouchStart={() => setActiveTrimHandle((prev) => ({ ...prev, [item.id]: 'end' }))}
                              className={`absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer ${
                                activeTrimHandle[item.id] === 'end' ? 'z-[2]' : 'z-[1]'
                              }`}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                            <span>Inicio: {item.trimStart.toFixed(1)}s</span>
                            <span>Fin: {item.trimEnd.toFixed(1)}s</span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>

              {/* Add buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                {photoCount < maxPhotos && (
                  <label className="flex items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed border-gray-700 hover:border-pink-500/60 bg-gray-900/60 hover:bg-gray-900 text-gray-400 hover:text-pink-300 cursor-pointer transition-all text-xs font-semibold">
                    <Plus className="w-4 h-4 text-pink-400" />
                    <span>Subir foto</span>
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                  </label>
                )}
                {maxVideoClips > 0 && videoCount < maxVideoClips && (
                  <label className="flex items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed border-gray-700 hover:border-pink-500/60 bg-gray-900/60 hover:bg-gray-900 text-gray-400 hover:text-pink-300 cursor-pointer transition-all text-xs font-semibold">
                    <Plus className="w-4 h-4 text-pink-400" />
                    <span>Subir video (máx. {(maxUploadBytes / (1024 * 1024)).toFixed(0)}MB combinados)</span>
                    <input type="file" accept="video/*" multiple onChange={handleVideoUpload} className="hidden" />
                  </label>
                )}
              </div>

              <p className="text-[11px] text-gray-400 mt-2">
                💡 Las fotos rotan con fundido cinematográfico y zoom lento (*Ken Burns*); los videos se reproducen sin su audio original (solo suena tu canción). El orden de la lista es el orden en que aparecen en el video.
              </p>
              {willLoop && (
                <p className="text-[11px] text-amber-300 mt-1">
                  🔁 Tu contenido no alcanza a llenar toda la canción, así que la secuencia completa se repite desde el principio hasta el final.
                </p>
              )}
              {totalVideoDurationSec > durationInSeconds && (
                <p className="text-[11px] text-rose-400 mt-1">
                  ⚠️ Tus videos ({Math.round(totalVideoDurationSec)}s) superan la duración de la canción ({Math.round(durationInSeconds)}s). Recorta alguno antes de generar.
                </p>
              )}
            </div>

            {/* Customizer: Title & Subtitle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Título en la píldora:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-900/90 border border-gray-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Subtítulo en la píldora:
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-900/90 border border-gray-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Subtitles / Lyrics section */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-pink-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Letra y Subtítulos Sincronizados (1 frase por línea)</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    const generated = generateSongLyrics({
                      names: song.names,
                      references: song.references,
                      style: song.style
                    });
                    setLyricsText(generated.join('\n'));
                    setIsLyricsEdited(true);
                  }}
                  className="text-[11px] font-bold text-yellow-300 hover:text-yellow-200 bg-yellow-950/40 border border-yellow-500/30 px-2.5 py-0.5 rounded-lg transition-all self-start sm:self-auto flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>{hasRealLyrics ? 'Usar versos genéricos en su lugar' : 'Regenerar versos poéticos'}</span>
                </button>
              </div>

              <textarea
                value={lyricsText}
                onChange={(e) => {
                  setLyricsText(e.target.value);
                  setIsLyricsEdited(true);
                }}
                rows={4}
                placeholder="Escribe cada verso o frase en una línea nueva. Cada línea se cantará con efecto karaoke resaltando palabra por palabra..."
                className="w-full px-4 py-2.5 bg-gray-900/90 border border-purple-500/40 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 resize-none font-mono"
              />

              <div className="flex items-center justify-between mt-1 text-[11px] text-gray-400">
                {usingRealTiming ? (
                  <span>🎯 <strong className="text-emerald-300">Letra real de tu canción:</strong> {parsedLyrics.length} frases con sincronía exacta palabra por palabra</span>
                ) : (
                  <span>🎤 <strong>Estilo Karaoke:</strong> {parsedLyrics.length} frases • ~{(durationInSeconds / (parsedLyrics.length || 1)).toFixed(1)}s por frase (estimado)</span>
                )}
                <span className="text-pink-300 hidden sm:inline">Resaltado de palabras en tiempo real</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 rounded-2xl bg-[#121630] border border-purple-500/20 space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-gray-300 text-center sm:text-left">
                  <span className="font-bold text-white block">Calidad de Video: Vertical 720×1280 (HD)</span>
                  <span className="text-gray-400 text-[11px]">
                    Listo para WhatsApp Status, Instagram Reels y TikTok · Videos de tu cuenta: {accountVideosUsed}/{maxVideoProjects}
                  </span>
                </div>

                {canCreateMoreVideos ? (
                  <button
                    type="button"
                    onClick={handleExportVideo}
                    disabled={isExporting}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-pink-900/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-50"
                  >
                    {isExporting ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin text-pink-300" />
                        <span>
                          {exportQueuePosition > 0
                            ? `En cola (posición ${exportQueuePosition})...`
                            : `Generando video (${exportProgress}%)...`}
                        </span>
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4" />
                        <span>{existingVideos.length > 0 ? 'Generar otro video' : 'Generar Video MP4'}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gray-900 border border-gray-700 text-gray-400 font-semibold text-xs text-center">
                    Ya usaste tus {maxVideoProjects} video{maxVideoProjects === 1 ? '' : 's'} disponibles en tu cuenta
                  </span>
                )}
              </div>

              {isExporting && (
                <div>
                  <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5 text-center sm:text-left">
                    Esto puede tardar varios minutos — puedes minimizar o cambiar de pestaña, tu video se sigue generando.
                  </p>
                </div>
              )}

              {existingVideos.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    Video{existingVideos.length > 1 ? 's' : ''} de esta canción ({existingVideos.length})
                  </p>
                  {existingVideos.map((v, idx) => (
                    <div
                      key={v.url || idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30"
                    >
                      <p className="text-[11px] text-amber-300 flex items-center gap-1.5 min-w-0">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          Video {idx + 1} — disponible por 14 días
                          {v.expiresAt && ` (hasta el ${new Date(v.expiresAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })})`}
                        </span>
                      </p>
                      <a
                        href={v.url}
                        download={buildVideoFilename(song)}
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-[11px] shadow-md shadow-emerald-900/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {exportError && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{exportError}</span>
                </p>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Remotion Live Player (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5 flex items-center gap-1.5">
              <span>Vista Previa en Vivo de Remotion</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            {/* Phone-like Mockup Container with 9:16 Aspect Ratio */}
            <div className="relative w-full max-w-[280px] sm:max-w-[310px] aspect-[9/16] rounded-[36px] overflow-hidden border-4 border-gray-800 shadow-2xl shadow-purple-950/80 bg-black remotion-player-container">

              <Player
                component={SongStoryVideoComposition}
                inputProps={{
                  mediaItems: mediaItems.map((m) =>
                    m.type === 'photo'
                      ? { type: 'photo', src: m.url, durationFrames: Math.round(m.durationSec * FPS) }
                      : {
                          type: 'video',
                          src: m.url,
                          durationFrames: Math.round(itemDuration(m) * FPS),
                          trimBeforeFrames: Math.round((m.trimStart || 0) * FPS),
                          trimAfterFrames: Math.round((m.trimEnd ?? m.fullDurationSec) * FPS)
                        }
                  ),
                  audioUrl: song.audioUrl,
                  title: title,
                  subtitle: subtitle,
                  lyrics: parsedLyrics,
                  lyricsLines: usingRealTiming ? realLyricsLines : null,
                  isExporting: false
                }}
                durationInFrames={durationInFrames}
                fps={FPS}
                compositionWidth={1080}
                compositionHeight={1920}
                style={{
                  width: '100%',
                  height: '100%'
                }}
                controls
                autoPlay={false}
                loop
              />

            </div>

            <p className="text-[11px] text-gray-500 text-center mt-3 max-w-[280px]">
              Dale a <strong>Play ▶</strong> para ver la rotación de fotos, escuchar el audio y ver la animación de la píldora.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-[#070914] flex items-center justify-between text-xs text-gray-400">
          <span>Generador de Video Vertical impulsado por Remotion</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold transition-all"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
