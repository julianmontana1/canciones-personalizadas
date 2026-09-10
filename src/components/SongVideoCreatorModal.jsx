import React, { useState, useEffect, useRef } from 'react';
import { Player } from '@remotion/player';
import { SongStoryVideoComposition } from '../video/SongStoryVideoComposition';
import { X, Upload, Trash2, Video, Sparkles, Music, Play, Download, Check, AlertCircle, Plus, Wand2 } from 'lucide-react';
import Sparkle from './Sparkle';
import { generateSongLyrics } from '../utils/lyricsGenerator';

export default function SongVideoCreatorModal({
  isOpen,
  onClose,
  song,
  accessCode
}) {
  // State for user photos (up to 5)
  const [photos, setPhotos] = useState([
    '/images/hero-vocalista.avif',
    '/images/demo-pedida-novia.avif'
  ]);
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
  const [exportPhase, setExportPhase] = useState('idle'); // 'idle' | 'recording' | 'converting'

  const playerRef = useRef(null);

  // Load the song's real lyrics + timestamps when available; only fall back to the
  // generic template generator for older songs that don't have real data.
  useEffect(() => {
    if (song) {
      const cleanName = (song.names || '').replace(/^(para|con amor para|dedicada a)\s+/i, '').trim() || 'Alguien especial';
      setTitle(`Para ${cleanName}`);
      setSubtitle(`${song.style || 'Canción Personalizada'} • Canción Oficial`);
      setIsLyricsEdited(false);

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

  if (!isOpen || !song) return null;

  // Parse lyrics into array
  const parsedLyrics = lyricsText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const usingRealTiming = hasRealLyrics && !isLyricsEdited;

  // Video configuration
  const durationInSeconds = Math.max(15, Math.min(song.duration || 30, 180));
  const fps = 30;
  const durationInFrames = durationInSeconds * fps;

  // Handle Photo Upload
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPhotoUrls = files.slice(0, 5 - photos.length).map((file) => URL.createObjectURL(file));
    setPhotos((prev) => [...prev, ...newPhotoUrls].slice(0, 5));
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Client-side quick recording / export using HTML Canvas & MediaRecorder
  const handleExportVideo = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportPhase('recording');

    const canvas = document.querySelector('.remotion-player-container canvas');
    
    if (!canvas) {
      alert("No se pudo acceder al visor de video. Asegúrate de reproducir el video primero.");
      setIsExporting(false);
      return;
    }

    try {
      // Start playback from frame 0
      playerRef.current?.seekTo(0);
      
      const stream = canvas.captureStream(30);
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();

      // Fetch the audio manually and play it via AudioContext to guarantee it gets recorded
      const response = await fetch(song.audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(dest);
      source.connect(audioCtx.destination); // Let user hear the playback while recording
      
      stream.addTrack(dest.stream.getAudioTracks()[0]);

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = async () => {
        const webmBlob = new Blob(chunks, { type: 'video/webm' });
        const baseName = `video_historia_${song.names?.replace(/\s+/g, '_') || 'serenatia'}`;

        // Browsers' MediaRecorder can't reliably produce a real MP4, so we always
        // record WebM and ask the server to transcode it to MP4 with ffmpeg.
        setExportPhase('converting');
        try {
          const transcodeRes = await fetch(`/api/video/transcode?code=${encodeURIComponent(accessCode || '')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'video/webm' },
            body: webmBlob
          });

          if (!transcodeRes.ok) {
            throw new Error('El servidor no pudo convertir el video a MP4.');
          }

          const mp4Blob = await transcodeRes.blob();
          const url = URL.createObjectURL(mp4Blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${baseName}.mp4`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (transcodeErr) {
          console.error('Error convirtiendo a MP4, se descarga el WebM original:', transcodeErr);
          alert('No se pudo convertir el video a MP4. Se descargará en formato WebM en su lugar.');
          const url = URL.createObjectURL(webmBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${baseName}.webm`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } finally {
          setIsExporting(false);
          setExportPhase('idle');
          setExportProgress(100);
        }
      };

      // Start recording and playback
      recorder.start();
      source.start(0);
      playerRef.current?.play();

      // Stop after duration
      const durationMs = durationInSeconds * 1000;
      let progress = 0;
      const interval = setInterval(() => {
        progress += 200;
        setExportProgress(Math.min(99, Math.floor((progress / durationMs) * 100)));
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        if (recorder.state === 'recording') recorder.stop();
        source.stop();
        playerRef.current?.pause();
      }, durationMs + 500);

    } catch (err) {
      console.error(err);
      alert("Hubo un error al grabar el video. Asegúrate de que tu navegador soporta esta función.");
      setIsExporting(false);
      setExportPhase('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-5xl my-auto bg-[#0a0d1d] border border-pink-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
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
                Convierte la canción de <strong>{song.names}</strong> en un video para Estados de WhatsApp, Instagram Reels o TikTok con hasta 5 fotos y letra.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Split: Editor (Left) & Remotion Live Preview (Right) */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto flex-1">
          
          {/* LEFT COLUMN: Controls & Photo Upload (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Photos upload area (up to 5) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-pink-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Sube tus Fotos (Hasta 5 fotos para rotar)</span>
                </label>
                <span className="text-[11px] font-mono text-gray-400">
                  {photos.length}/5 fotos añadidas
                </span>
              </div>

              {/* Photo Thumbnails */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mb-3">
                {photos.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-2xl overflow-hidden border border-purple-500/40 group shadow-md"
                  >
                    <img src={src} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-black/70 text-white">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute inset-0 bg-rose-950/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-4 h-4 text-rose-300" />
                    </button>
                  </div>
                ))}

                {/* Add Photo Button if less than 5 */}
                {photos.length < 5 && (
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-700 hover:border-pink-500/60 bg-gray-900/60 hover:bg-gray-900 flex flex-col items-center justify-center text-gray-400 hover:text-pink-300 cursor-pointer transition-all">
                    <Plus className="w-6 h-6 mb-1 text-pink-400" />
                    <span className="text-[10px] font-semibold">Subir foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <p className="text-[11px] text-gray-400">
                💡 Cada foto rotará suavemente con fundido cinematográfico y zoom lento (*Ken Burns*) durante la canción.
              </p>
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
            <div className="p-4 rounded-2xl bg-[#121630] border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-300 text-center sm:text-left">
                <span className="font-bold text-white block">Calidad de Video: Vertical 1080×1920 (HD)</span>
                <span className="text-gray-400 text-[11px]">Listo para WhatsApp Status, Instagram Reels y TikTok.</span>
              </div>

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
                      {exportPhase === 'converting'
                        ? 'Convirtiendo a MP4...'
                        : `Grabando video (${exportProgress}%)...`}
                    </span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Descargar Video MP4</span>
                  </>
                )}
              </button>
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
                ref={playerRef}
                component={SongStoryVideoComposition}
                inputProps={{
                  photos: photos.length > 0 ? photos : ['/images/hero-vocalista.avif'],
                  audioUrl: song.audioUrl,
                  title: title,
                  subtitle: subtitle,
                  lyrics: parsedLyrics,
                  lyricsLines: usingRealTiming ? realLyricsLines : null,
                  fps: fps,
                  isExporting: isExporting
                }}
                durationInFrames={durationInFrames}
                fps={fps}
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
