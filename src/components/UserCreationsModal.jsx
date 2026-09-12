import React, { useState } from 'react';
import { X, Music, Download, Play, Pause, Video, Sparkles, Clock, Calendar, Search, RefreshCw, FileText } from 'lucide-react';
import Sparkle from './Sparkle';
import { buildSongFilename, buildVideoFilename } from '../utils/filenameBuilder';

export default function UserCreationsModal({
  isOpen,
  onClose,
  songs = [],
  activeCode = '',
  onSelectSongForPlayer,
  onOpenVideoCreator
}) {
  const [search, setSearch] = useState('');
  const [playingSongId, setPlayingSongId] = useState(null);
  const [audioElement, setAudioElement] = useState(null);

  if (!isOpen) return null;

  const filteredSongs = songs.filter((s) => {
    const term = search.toLowerCase();
    return (
      (s.names && s.names.toLowerCase().includes(term)) ||
      (s.style && s.style.toLowerCase().includes(term)) ||
      (s.references && s.references.toLowerCase().includes(term))
    );
  });

  const handleTogglePlay = (song) => {
    if (playingSongId === song.id) {
      if (audioElement) {
        audioElement.pause();
      }
      setPlayingSongId(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const newAudio = new Audio(song.audioUrl);
      newAudio.play().catch((e) => console.error("Audio playback error", e));
      newAudio.onended = () => setPlayingSongId(null);
      setAudioElement(newAudio);
      setPlayingSongId(song.id);
    }
  };

  const handleClose = () => {
    if (audioElement) {
      audioElement.pause();
    }
    setPlayingSongId(null);
    onClose();
  };

  const handleDownload = async (song) => {
    try {
      const res = await fetch(song.audioUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = buildSongFilename(song);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 2000);
    } catch (err) {
      window.open(song.audioUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-w-4xl max-h-[100dvh] sm:max-h-[90vh] bg-[#0c0f1f] border border-purple-500/30 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-800 flex items-center justify-between gap-4 bg-[#0e1226]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/40 flex-shrink-0">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  Mis Creaciones Realizadas
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-bold font-mono">
                  {songs.length} {songs.length === 1 ? 'canción' : 'canciones'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Todas las canciones creadas con tu código permanecen guardadas para que las escuches, descargues o conviertas en video.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        {songs.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-800/80 bg-gray-950/40 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por dedicatoria, género o recuerdo..."
                className="w-full pl-9 pr-4 py-2 bg-gray-900/80 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            {activeCode && (
              <span className="hidden sm:inline text-[11px] text-gray-400 font-mono bg-gray-900 px-3 py-2 rounded-xl border border-gray-800">
                Código: <strong className="text-purple-300">{activeCode}</strong>
              </span>
            )}
          </div>
        )}

        {/* Song List Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3.5">
          {filteredSongs.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-3xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-500 mx-auto mb-3">
                <Music className="w-8 h-8 opacity-40" />
              </div>
              <h4 className="text-base font-bold text-gray-300">
                {songs.length === 0
                  ? 'Aún no hay canciones creadas con este código'
                  : 'No se encontraron canciones que coincidan con la búsqueda'}
              </h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                {songs.length === 0
                  ? 'Completa el formulario en 4 pasos para componer tu primera canción personalizada.'
                  : 'Prueba buscando con otro término o borra el filtro.'}
              </p>
            </div>
          ) : (
            filteredSongs.map((song) => {
              const isPlaying = playingSongId === song.id;
              // A song can hold several independent finished videos at once
              // (plan-dependent); older records carry a single videoUrl instead.
              const existingVideos = Array.isArray(song.videos)
                ? song.videos
                : song.videoUrl
                  ? [{ url: song.videoUrl, expiresAt: song.videoExpiresAt }]
                  : [];
              const activeVideos = existingVideos.filter((v) => !v.expiresAt || new Date(v.expiresAt).getTime() > Date.now());
              // maxVideoProjects is spent per ACCOUNT, not per song — a customer can
              // put both of their plan's video slots on the same song or split them.
              const accountVideosUsed = song.accountVideosUsed ?? activeVideos.length;
              const canCreateMoreVideos = accountVideosUsed < (song.maxVideoProjects ?? 1);

              return (
                <div
                  key={song.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isPlaying
                      ? 'bg-purple-950/30 border-purple-500/60 shadow-lg shadow-purple-950/40'
                      : 'bg-[#101428]/90 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {/* Left: Play button + Info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Play/Pause round button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePlay(song)}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
                        isPlaying
                          ? 'bg-gradient-to-tr from-pink-600 to-purple-600 text-white shadow-md shadow-pink-900/50 animate-pulse'
                          : 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30'
                      }`}
                      title={isPlaying ? 'Pausar' : 'Reproducir muestra'}
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {song.style || 'Canción Personalizada'}
                        </span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-teal-400" />
                          <span>{song.duration}s</span>
                        </span>
                        {song.timestamp && (
                          <span className="text-[11px] text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(song.timestamp).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-white mt-1 truncate">
                        {song.names || 'Canción para alguien especial'}
                      </h4>

                      {song.references && (
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                          "{song.references}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end pt-2 md:pt-0 border-t md:border-t-0 border-gray-800">
                    
                    {/* Video: a download link per active video (a song can hold several,
                        plan-dependent), plus the creator CTA while under the plan's limit */}
                    {song.hasVideo !== false && (
                      <>
                        {activeVideos.map((v, idx) => (
                          <a
                            key={v.url || idx}
                            href={v.url}
                            download={buildVideoFilename(song)}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs shadow-md shadow-emerald-900/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                            title={v.expiresAt ? `Disponible hasta el ${new Date(v.expiresAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}` : 'Descargar video'}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{activeVideos.length > 1 ? `Video ${idx + 1}` : 'Video'}</span>
                          </a>
                        ))}
                        {canCreateMoreVideos && (
                          <button
                            type="button"
                            onClick={() => {
                              handleClose();
                              onOpenVideoCreator(song);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-pink-900/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                            title="Crear video vertical 9:16 con tus fotos"
                          >
                            <Video className="w-3.5 h-3.5 text-pink-200" />
                            <span>{activeVideos.length > 0 ? 'Otro Video' : 'Crear Video'}</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* Descargar MP3 */}
                    <button
                      type="button"
                      onClick={() => handleDownload(song)}
                      className="p-2 sm:px-3 sm:py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-emerald-400 hover:text-emerald-300 text-xs font-semibold transition-all flex items-center gap-1.5"
                      title="Descargar archivo MP3"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">MP3</span>
                    </button>

                    {/* Cargar en reproductor principal */}
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        onSelectSongForPlayer(song);
                      }}
                      className="px-3 py-2 rounded-xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white text-xs font-medium transition-all"
                    >
                      Abrir
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800/80 bg-gray-950/60 flex items-center justify-between text-xs text-gray-500">
          <span>Tus canciones no se borran; quedan ligadas a tu código de acceso.</span>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold transition-all"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
