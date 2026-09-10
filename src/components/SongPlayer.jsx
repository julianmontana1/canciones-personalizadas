import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2, VolumeX, Sparkles, Music, CheckCircle2 } from 'lucide-react';

export default function SongPlayer({ song, title, subtitle }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const audioSrc = song?.audioUrl || '';

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDownloaded(false);
  }, [audioSrc]);

  const togglePlay = (e) => {
    if (e) e.preventDefault();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((err) => {
        console.error("Playback error:", err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || song.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = (e) => {
    if (e) e.preventDefault();
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownload = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await fetch(audioSrc);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = song.filename || `cancion_${song.names?.replace(/\s+/g, '_') || 'personalizada'}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 2000);
      setDownloaded(true);
    } catch (err) {
      console.warn("Direct blob download fallback", err);
      const link = document.createElement('a');
      link.href = audioSrc;
      link.download = song.filename || 'cancion.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloaded(true);
    }
  };

  return (
    <div className="glass-panel-glow p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-purple-500/30">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Decorative background glow */}
      <div className="absolute -right-16 -top-16 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-60 h-60 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6">
        
        {/* Track Info Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-pink-500 p-0.5 shadow-xl shadow-purple-500/25 flex-shrink-0">
              <div className="w-full h-full bg-gray-900/90 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <Music className={`w-8 h-8 text-purple-300 ${isPlaying ? 'scale-110' : ''} transition-transform`} />
                {isPlaying && (
                  <div className="absolute inset-0 bg-purple-500/20 animate-pulse" />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                  {song?.style || 'Canción Personalizada'}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Canción generada
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                {title || song?.names || 'Tu Canción'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 line-clamp-1">
                {subtitle || song?.references || 'Composición única generada con IA'}
              </p>
            </div>
          </div>

          {/* Top Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            title="Descargar archivo MP3"
          >
            {downloaded ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">{downloaded ? '¡Descargado!' : 'Descargar MP3'}</span>
          </button>
        </div>

        {/* Dynamic Animated Waveform */}
        <div className="bg-gray-950/60 rounded-2xl p-4 border border-gray-800/80 flex items-center justify-center gap-1.5 h-20 overflow-hidden">
          {[
            'animate-wave-1', 'animate-wave-3', 'animate-wave-5', 'animate-wave-2',
            'animate-wave-4', 'animate-wave-6', 'animate-wave-2', 'animate-wave-5',
            'animate-wave-1', 'animate-wave-4', 'animate-wave-3', 'animate-wave-6',
            'animate-wave-2', 'animate-wave-5', 'animate-wave-1', 'animate-wave-4',
            'animate-wave-3', 'animate-wave-2', 'animate-wave-5', 'animate-wave-6',
            'animate-wave-1', 'animate-wave-4', 'animate-wave-2', 'animate-wave-5',
            'animate-wave-3', 'animate-wave-1', 'animate-wave-6', 'animate-wave-4'
          ].map((animClass, idx) => (
            <span
              key={idx}
              className={`w-1.5 rounded-full transition-all duration-300 ${
                isPlaying
                  ? `bg-gradient-to-t from-purple-500 to-pink-400 ${animClass}`
                  : 'bg-gray-800 h-2'
              }`}
              style={{
                height: isPlaying ? undefined : `${Math.sin(idx) * 12 + 14}px`
              }}
            />
          ))}
        </div>

        {/* Progress Bar & Seek */}
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500 focus:outline-none"
          />
          <div className="flex justify-between text-xs font-mono text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between pt-1">
          
          {/* Mute/Volume */}
          <button
            type="button"
            onClick={toggleMute}
            className="text-gray-400 hover:text-white p-2.5 rounded-xl hover:bg-gray-800/60 transition-colors"
            title={isMuted ? "Activar sonido" : "Silenciar"}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Big Play / Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-indigo-500 p-0.5 shadow-2xl shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
          >
            <div className="w-full h-full bg-gray-950 rounded-full flex items-center justify-center group-hover:bg-opacity-80 transition-all">
              {isPlaying ? (
                <Pause className="w-7 h-7 text-white fill-white" />
              ) : (
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              )}
            </div>
          </button>

          <div className="w-10" />
        </div>

        {/* PROMINENT ULTRA-VISIBLE DOWNLOAD ACTION BANNER */}
        <div className="pt-3 border-t border-gray-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-950/20 p-4 rounded-2xl border border-emerald-500/30">
          <div className="text-center sm:text-left">
            <div className="font-bold text-white text-sm flex items-center justify-center sm:justify-start gap-1.5">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Descarga tu archivo de audio MP3</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Guárdala en tu teléfono o computadora para enviarla por WhatsApp o redes sociales.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm rounded-xl shadow-xl shadow-emerald-950/60 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>DESCARGAR CANCIÓN MP3</span>
          </button>
        </div>

      </div>
    </div>
  );
}
