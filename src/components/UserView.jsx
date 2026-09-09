import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Music2, Clock, FileText, UserCheck, Key, 
  CheckCircle2, AlertTriangle, Wand2, RefreshCw, Mic, Volume2, 
  Square, ShieldCheck, History, Download, Play, Pause, ChevronDown, ChevronUp,
  Baby, Heart, Flame, Radio
} from 'lucide-react';
import SongPlayer from './SongPlayer';
import VoiceAssistantModal from './VoiceAssistantModal';
import { playGenrePreview, stopAllAudioPreviews } from '../utils/genreAudioSynthesizer';
import { createSpeechRecognizer } from '../utils/speechRecognition';

const GENRE_PRESETS = [
  // Niños & Dormir
  { id: 'infantil', category: 'kids', name: 'Música Infantil / Niños', desc: 'Divertida, rítmica y alegre para jugar', icon: '🎈' },
  { id: 'dormir', category: 'kids', name: 'Canción de Dormir / Nana', desc: 'Suave, relajante, piano y caja de música', icon: '🌙' },

  // Regional & Fiesta
  { id: 'salsa', category: 'latin', name: 'Salsa Brava / Caribeña', desc: 'Trompetas vivas, piano montuno y congas', icon: '💃' },
  { id: 'mariachi', category: 'latin', name: 'Mariachi Tradicional', desc: 'Trompetas mexicanas, violines y guitarrón', icon: '🎺' },
  { id: 'banda', category: 'latin', name: 'Banda Sinaloense', desc: 'Metales potentes, tambora, tuba y sabor norteño', icon: '🤠' },
  { id: 'cumbia', category: 'latin', name: 'Cumbia / Fiesta', desc: 'Sabor tropical, acordeón y ritmo bailable', icon: '🎉' },

  // Populares & Románticos
  { id: 'pop', category: 'pop', name: 'Pop Latino Moderno', desc: 'Melódico, rítmico y pegadizo', icon: '✨' },
  { id: 'balada', category: 'pop', name: 'Balada Romántica', desc: 'Emotiva, piano acústico y cuerdas', icon: '❤️' },
  { id: 'acustico', category: 'pop', name: 'Acústico Íntimo', desc: 'Guitarra acústica de palo y voz cálida', icon: '🪕' },

  // Urbano & Energético
  { id: 'reggaeton', category: 'urban', name: 'Reggaetón / Urbano', desc: 'Beat bailable, dembow y ritmo moderno', icon: '🔥' },
  { id: 'rock', category: 'urban', name: 'Rock / Pop Rock', desc: 'Guitarras eléctricas potentes y batería viva', icon: '🎸' },
  { id: 'lofi', category: 'urban', name: 'Lo-Fi Chill Hop', desc: 'Relajado, nostálgico, estilo vinilo', icon: '☕' },
  { id: 'electronica', category: 'urban', name: 'Electrónica / EDM', desc: 'Sintetizadores enérgicos y fiesta total', icon: '⚡' },
];

const GENRE_CATEGORIES = [
  { id: 'all', label: 'Todos (13)' },
  { id: 'kids', label: '👶 Para Niños', badge: 'Nuevo' },
  { id: 'latin', label: '🎺 Regional & Fiesta', badge: 'Nuevo' },
  { id: 'pop', label: '✨ Pop & Romántico' },
  { id: 'urban', label: '🔥 Urbano & Rock' },
];

const DURATION_PRESETS = [
  { label: '30 seg', value: 30 },
  { label: '60 seg', value: 60 },
  { label: '90 seg', value: 90 },
  { label: '120 seg', value: 120 },
  { label: '180 seg', value: 180 },
];

export default function UserView() {
  // Access code state
  const [accessCode, setAccessCode] = useState(() => localStorage.getItem('songcraft_user_code') || '');
  const [codeInfo, setCodeInfo] = useState(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState('');

  // Form parameters
  const [names, setNames] = useState('');
  const [references, setReferences] = useState('');
  const [style, setStyle] = useState(GENRE_PRESETS[0].name);
  const [customStyle, setCustomStyle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [duration, setDuration] = useState(60);

  // States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [error, setError] = useState('');
  const [generatedSong, setGeneratedSong] = useState(() => {
    try {
      const saved = localStorage.getItem('songcraft_active_song');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Code history state
  const [myCodeSongs, setMyCodeSongs] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Voice Assistant Modal
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isInlineRecordingNames, setIsInlineRecordingNames] = useState(false);
  const [isInlineRecordingRefs, setIsInlineRecordingRefs] = useState(false);

  // 10-second preview state (real studio audio)
  const [playingPreviewGenre, setPlayingPreviewGenre] = useState(null);

  // Validate stored code on initial load
  useEffect(() => {
    if (accessCode) {
      validateCode(accessCode);
    }
  }, []);

  // Fetch my songs when code is valid
  useEffect(() => {
    if (codeInfo?.valid && accessCode) {
      fetchCodeHistory(accessCode);
    }
  }, [codeInfo?.valid, accessCode]);

  // Clean up audio previews on unmount
  useEffect(() => {
    return () => {
      stopAllAudioPreviews();
    };
  }, []);

  // Generation step timer
  useEffect(() => {
    let timer;
    if (isGenerating) {
      setGenerationStep(0);
      timer = setInterval(() => {
        setGenerationStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isGenerating]);

  // Validate Access Code
  const validateCode = async (codeToTest) => {
    const clean = (codeToTest || accessCode).trim().toUpperCase();
    if (!clean) {
      setCodeError('Por favor ingresa un código de acceso.');
      return;
    }

    setIsValidatingCode(true);
    setCodeError('');

    try {
      const res = await fetch(`/api/codes/validate?code=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setCodeInfo(null);
        setCodeError(data.error || 'Código de acceso no válido');
        return;
      }

      setCodeInfo(data);
      setAccessCode(clean);
      localStorage.setItem('songcraft_user_code', clean);
      fetchCodeHistory(clean);
    } catch (err) {
      setCodeError('Error al contactar con el servidor de validación.');
    } finally {
      setIsValidatingCode(false);
    }
  };

  const fetchCodeHistory = async (code) => {
    try {
      const res = await fetch(`/api/codes/my-songs?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const list = await res.json();
        setMyCodeSongs(list);
      }
    } catch (e) {
      console.warn("Could not fetch code history", e);
    }
  };

  // Toggle 10-second real instrument studio preview
  const handleToggleGenrePreview = (e, genreId) => {
    e.stopPropagation();
    if (playingPreviewGenre === genreId) {
      stopAllAudioPreviews();
      setPlayingPreviewGenre(null);
    } else {
      setPlayingPreviewGenre(genreId);
      playGenrePreview(genreId, () => {
        setPlayingPreviewGenre(null);
      });
    }
  };

  // Handle single field speech dictation
  const handleSingleFieldVoice = (field) => {
    const isTargetNames = field === 'names';
    const isTargetRefs = field === 'refs';

    if (isTargetNames && isInlineRecordingNames) {
      setIsInlineRecordingNames(false);
      return;
    }
    if (isTargetRefs && isInlineRecordingRefs) {
      setIsInlineRecordingRefs(false);
      return;
    }

    if (isTargetNames) setIsInlineRecordingNames(true);
    if (isTargetRefs) setIsInlineRecordingRefs(true);

    const rec = createSpeechRecognizer({
      onResult: (text) => {
        if (isTargetNames) setNames(text);
        if (isTargetRefs) setReferences(text);
      },
      onError: () => {
        setIsInlineRecordingNames(false);
        setIsInlineRecordingRefs(false);
      },
      onEnd: () => {
        setIsInlineRecordingNames(false);
        setIsInlineRecordingRefs(false);
      }
    });

    if (rec) {
      try {
        rec.start();
      } catch (e) {
        setIsInlineRecordingNames(false);
        setIsInlineRecordingRefs(false);
      }
    }
  };

  // Handle voice assistant modal apply
  const handleApplyVoiceData = (data) => {
    if (data.names) setNames(data.names);
    if (data.references) setReferences(data.references);
    if (data.style) {
      setStyle(data.style);
      setCustomStyle('');
    }
    if (data.duration) setDuration(data.duration);
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');

    if (!codeInfo?.valid) {
      setError('Por favor ingresa y valida un código de acceso antes de generar.');
      return;
    }

    if (codeInfo.isExhausted) {
      setError('Este código ha agotado todas sus canciones permitidas.');
      return;
    }

    if (!names.trim()) {
      setError('Por favor especifica los nombres o a quién va dirigida la canción.');
      return;
    }

    stopAllAudioPreviews();
    setPlayingPreviewGenre(null);

    setIsGenerating(true);
    setGeneratedSong(null);
    localStorage.removeItem('songcraft_active_song');

    const chosenStyle = customStyle.trim() || style;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: accessCode,
          names: names.trim(),
          references: references.trim(),
          style: chosenStyle,
          duration: duration
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Ocurrió un problema al generar la canción.');
      }

      setGeneratedSong(data.song);
      localStorage.setItem('songcraft_active_song', JSON.stringify(data.song));
      
      // Refresh code validation & history
      validateCode(accessCode);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetForNewSong = () => {
    setGeneratedSong(null);
    localStorage.removeItem('songcraft_active_song');
    setNames('');
    setReferences('');
    setError('');
  };

  // Filtered genres by category
  const filteredPresets = selectedCategory === 'all'
    ? GENRE_PRESETS
    : GENRE_PRESETS.filter((p) => p.category === selectedCategory);

  const loadingSteps = [
    'Verificando código y conectando con ElevenLabs...',
    'Estructurando letra, métrica y arreglos vocales...',
    'Sintetizando instrumentos y melodía en alta fidelidad...',
    'Generando masterización final en formato MP3...'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      
      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApplyParsedData={handleApplyVoiceData}
      />

      {/* Hero Header */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3 shadow-sm shadow-purple-900/30">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>Generador Musical Inteligente con ElevenLabs</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Crea tu Canción Personalizada <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">
            con Inteligencia Artificial
          </span>
        </h1>
        <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto mt-2.5">
          Ingresa tus nombres y recuerdos (o díctalos por voz). La IA compondrá una canción única en cuestión de segundos, lista para escuchar y descargar en MP3.
        </p>

        {/* Hero Visual Showcase Banner */}
        <div className="mt-6 relative rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl shadow-purple-900/30 group">
          <img
            src="/hero-banner.jpg"
            alt="SongCraft AI Studio"
            className="w-full h-44 sm:h-56 object-cover object-center group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080c16] via-[#080c16]/50 to-transparent flex items-end p-5 sm:p-6">
            <div className="text-left w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-purple-300 bg-purple-950/80 px-2.5 py-0.5 rounded-full border border-purple-500/40">
                  Estudio Virtual Activo
                </span>
                <p className="text-sm text-white font-medium mt-1">
                  13 Géneros disponibles: Infantil, Nana de dormir, Salsa, Mariachi, Banda y más
                </p>
              </div>

              {/* Quick Voice Assistant Trigger in Hero */}
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs shadow-lg shadow-purple-950/50 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
              >
                <Mic className="w-4 h-4 animate-pulse" />
                <span>Dictar por Voz</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: ACCESS CODE BOX */}
      <div className="glass-panel p-5 rounded-2xl border border-gray-800 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Tu Código de Acceso</span>
                {codeInfo?.valid && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    {codeInfo.remaining === 'unlimited' ? '♾️ Ilimitado' : `${codeInfo.remaining} canciones restantes`}
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Ingresa tu código asignado para desbloquear la generación de canciones.
              </p>
            </div>
          </div>

          {/* Input & Validate Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="Ej: TEST-1SONG-7A9B"
              className="px-3.5 py-2 bg-gray-950 border border-gray-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono uppercase tracking-wider flex-1 sm:w-56"
            />
            <button
              type="button"
              onClick={() => validateCode(accessCode)}
              disabled={isValidatingCode}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/30 transition-all disabled:opacity-50 flex-shrink-0"
            >
              {isValidatingCode ? 'Validando...' : 'Aplicar'}
            </button>
          </div>
        </div>

        {/* Code error */}
        {codeError && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{codeError}</span>
          </div>
        )}

        {/* Demo Quick Codes Selector */}
        <div className="mt-3 pt-3 border-t border-gray-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-400 text-[11px]">Códigos de prueba:</span>
          {[
            { label: '1 Canción', code: 'TEST-1SONG-7A9B' },
            { label: '5 Canciones', code: 'VIP-5SONGS-K3M8' },
            { label: 'Ilimitado Personal', code: 'MASTER-UNLIMITED-PRO' }
          ].map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                setAccessCode(c.code);
                validateCode(c.code);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all border ${
                accessCode === c.code
                  ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                  : 'bg-gray-900/80 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
              }`}
            >
              {c.label} ({c.code})
            </button>
          ))}
        </div>

        {/* User Code History Toggle */}
        {codeInfo?.valid && myCodeSongs.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-800/80">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full text-xs text-purple-300 hover:text-purple-200"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" />
                <span>Mis Canciones Generadas con este Código ({myCodeSongs.length})</span>
              </div>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showHistory && (
              <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
                {myCodeSongs.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-xl bg-gray-950/70 border border-gray-800/80 flex items-center justify-between text-xs gap-3"
                  >
                    <div>
                      <div className="font-semibold text-white">{s.names}</div>
                      <div className="text-[10px] text-gray-400">
                        {s.style} • {s.duration}s • {new Date(s.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setGeneratedSong(s);
                          localStorage.setItem('songcraft_active_song', JSON.stringify(s));
                        }}
                        className="px-2.5 py-1 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30"
                      >
                        Cargar
                      </button>
                      <a
                        href={s.audioUrl}
                        download={s.filename}
                        className="p-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 hover:text-emerald-200"
                        title="Descargar MP3"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Result View (if song generated or active) */}
      {generatedSong && (
        <div className="mb-10 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>¡Tu canción está lista para escuchar y descargar!</span>
            </div>
            <button
              type="button"
              onClick={handleResetForNewSong}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Crear otra canción
            </button>
          </div>

          <SongPlayer
            song={generatedSong}
            title={`Canción para ${generatedSong.names}`}
            subtitle={`Estilo: ${generatedSong.style} • Duración: ${generatedSong.duration}s`}
          />

          <div className="p-3.5 rounded-2xl bg-gray-900/40 border border-gray-800 text-xs text-gray-400 text-center">
            💾 <strong>Tu canción permanece guardada en esta pantalla:</strong> Si recargas la página o sales de la pestaña, tu canción seguirá aquí lista para reproducir y descargar.
          </div>
        </div>
      )}

      {/* Main Creation Card Form */}
      {!generatedSong && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-gray-800/80 shadow-2xl relative">
          
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Parameter: Names with inline mic dictation */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  <span>¿Para quién o qué es la canción? (Nombres / Dedicatoria)</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleSingleFieldVoice('names')}
                  className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                    isInlineRecordingNames
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : 'bg-gray-800/80 text-gray-400 hover:text-purple-300 border-gray-700'
                  }`}
                  title="Dictar por voz este campo"
                >
                  <Mic className="w-3 h-3" />
                  <span>{isInlineRecordingNames ? 'Grabando...' : 'Dictar'}</span>
                </button>
              </div>
              <input
                type="text"
                value={names}
                onChange={(e) => setNames(e.target.value)}
                placeholder="Ejemplo: Para mi bebé Mateo / Para Sofía en sus 15 años / Para Don Ramón con Mariachi"
                required
                className="w-full px-4 py-3 bg-gray-900/90 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>

            {/* Parameter: References with inline mic dictation */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-pink-400" />
                  <span>Referencias, Anécdotas y Emociones Clave</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleSingleFieldVoice('refs')}
                  className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                    isInlineRecordingRefs
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : 'bg-gray-800/80 text-gray-400 hover:text-pink-300 border-gray-700'
                  }`}
                  title="Dictar por voz anécdotas y detalles"
                >
                  <Mic className="w-3 h-3" />
                  <span>{isInlineRecordingRefs ? 'Grabando...' : 'Dictar historia'}</span>
                </button>
              </div>
              <textarea
                value={references}
                onChange={(e) => setReferences(e.target.value)}
                rows={3}
                placeholder="Escribe detalles que deban estar en la canción: cómo es la persona, sus juguetes o travesuras, anécdotas inolvidables, lugares o momentos especiales..."
                className="w-full px-4 py-3 bg-gray-900/90 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all resize-none"
              />
            </div>

            {/* Parameter: Song Type / Style WITH REAL 10-SECOND DEMOS & CATEGORIES */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                  <Music2 className="w-4 h-4 text-indigo-400" />
                  <span>Estilo y Género Musical</span>
                </label>
                <span className="text-[11px] text-gray-400">
                  🎧 Haz clic en <span className="text-amber-400 font-semibold">Demo 10s</span> para escuchar instrumentos reales
                </span>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {GENRE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                        : 'bg-gray-900/80 border border-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {cat.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-pink-500 text-white">
                        {cat.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Genre Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredPresets.map((preset) => {
                  const isPlayingThis = playingPreviewGenre === preset.id;
                  const isSelected = style === preset.name && !customStyle;

                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setStyle(preset.name);
                        setCustomStyle('');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-500 shadow-md shadow-purple-900/30 text-white'
                          : 'bg-gray-900/60 border-gray-800 hover:border-gray-700 text-gray-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xl">{preset.icon}</span>
                          
                          {/* 10s Real Audio Demo Button */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleGenrePreview(e, preset.id)}
                            className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                              isPlayingThis
                                ? 'bg-amber-500 text-gray-950 border-amber-400 shadow-md shadow-amber-500/30 animate-pulse'
                                : 'bg-gray-800/90 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                            }`}
                            title="Escuchar 10s con instrumentos reales de estudio"
                          >
                            {isPlayingThis ? (
                              <>
                                <Square className="w-2.5 h-2.5 fill-current" />
                                <span>Parar</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-2.5 h-2.5 fill-current text-amber-400" />
                                <span>Demo 10s</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="font-semibold text-xs text-white line-clamp-1">{preset.name}</div>
                        <div className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{preset.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom style input option */}
              <div className="mt-2.5">
                <input
                  type="text"
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                  placeholder="O escribe otro género personalizado (ej: Vallenato romántico, Flamenco moderno...)"
                  className="w-full px-3.5 py-2 bg-gray-950/60 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Parameter: Duration */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span>Duración de la Canción</span>
                </label>
                <span className="text-xs font-bold text-teal-400 font-mono">
                  {duration} segundos ({Math.floor(duration / 60)}m {duration % 60 ? `${duration % 60}s` : ''})
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setDuration(preset.value)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                      duration === preset.value
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-sm'
                        : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isGenerating || !codeInfo?.valid || codeInfo?.isExhausted}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-purple-900/40 hover:shadow-purple-700/50 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Creando tu canción personalizada...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 text-pink-200" />
                    <span>Generar Canción con ElevenLabs</span>
                  </>
                )}
              </button>
              {!codeInfo?.valid && (
                <p className="text-[11px] text-amber-400/90 text-center mt-2">
                  ⚠️ Debes validar un código de acceso arriba para habilitar la generación.
                </p>
              )}
            </div>

            {/* Live generation progress banner */}
            {isGenerating && (
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/60 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-xs text-purple-300">
                  <span className="font-semibold">{loadingSteps[generationStep]}</span>
                  <span className="font-mono">{((generationStep + 1) * 25)}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700 rounded-full"
                    style={{ width: `${(generationStep + 1) * 25}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 text-center">
                  ElevenLabs está sintetizando la música y las vocales. Esto toma entre 10 y 25 segundos.
                </p>
              </div>
            )}

          </form>

        </div>
      )}

    </div>
  );
}
