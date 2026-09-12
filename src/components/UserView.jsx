import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Music2, Clock, UserCheck, Key,
  CheckCircle2, AlertTriangle, Wand2, RefreshCw, Mic, Volume2,
  Square, ShieldCheck, History, Play, Pause, ChevronDown, ChevronUp,
  Baby, Heart, Flame, Radio, Moon, Cake, Headphones, ArrowRight, Star,
  Check, Disc3, ShieldAlert, ChevronLeft, ChevronRight, FileText
} from 'lucide-react';

import SongPlayer from './SongPlayer';
import VoiceAssistantModal from './VoiceAssistantModal';
import SongWizard from './SongWizard';
import Sparkle, { SparkleCluster } from './Sparkle';
import BrandMark from './BrandMark';
import { BrandSongIcon, BrandStoryIcon, BrandAiIcon, BrandDownloadIcon } from './BrandIcons';
import AccessCodeTopBar from './AccessCodeTopBar';
import UserCreationsModal from './UserCreationsModal';
import SongVideoCreatorModal from './SongVideoCreatorModal';
import GenreGuideModal from './GenreGuideModal';
import { playGenrePreview, stopAllAudioPreviews } from '../utils/genreAudioSynthesizer';
import { MOOD_FILTERS, filterByMood } from '../utils/moodFilters';
import { createSpeechRecognizer } from '../utils/speechRecognition';
import { GENRE_PRESETS } from '../data/genrePresets';

// Presentation metadata for the public showcase demos (content comes from the backend /api/demos)
const PUBLIC_DEMO_META = {
  'demo-a-pedida-novia': {
    title: 'Pedida de Novia',
    subtitle: 'Palabras al Viento',
    icon: Heart,
    accentClass: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    image: '/images/demo-pedida-novia.avif'
  },
  'demo-b-nana-martina': {
    title: 'Nana para Dormir',
    subtitle: 'Nana para Martina',
    icon: Moon,
    accentClass: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    image: '/images/demo-nana-martina.avif'
  },
  'demo-c-cumple-papa': {
    title: 'Cumpleaños con Banda',
    subtitle: 'Cumpleaños de Don Roberto',
    icon: Cake,
    accentClass: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    image: '/images/demo-cumpleanos-papa.avif'
  }
};

const DURATION_PRESETS = [
  { label: '30 seg', value: 30 },
  { label: '60 seg', value: 60 },
  { label: '90 seg', value: 90 },
  { label: '120 seg', value: 120 },
  { label: '180 seg', value: 180 },
  { label: '240 seg', value: 240 },
];

const FAQ_ITEMS = [
  {
    q: '¿Cuánto tarda en llegar mi canción?',
    a: 'La Inteligencia Artificial compone letra, música y voces en menos de un minuto. Apenas termina, la escuchas y descargas directamente en esta misma página — no necesitas esperar ningún correo.'
  },
  {
    q: '¿Puedo elegir el tipo de voz?',
    a: 'Sí. Al crear tu canción puedes elegir voz masculina, femenina, ambas (a dúo) o dejar que la IA elija la que mejor combine con el género y la historia.'
  },
  {
    q: '¿Funciona en mi celular?',
    a: 'Totalmente. SerenatIA funciona en cualquier celular, tablet o computador con navegador web moderno. No necesitas instalar ninguna aplicación.'
  },
  {
    q: '¿En qué calidad viene la canción?',
    a: 'Todas las canciones se generan en MP3 de alta fidelidad (320 kbps a 48 kHz) y pasan por una masterización automática que garantiza un sonido profesional y parejo.'
  },
  {
    q: '¿Puedo pedir cambios o una nueva versión?',
    a: 'Sí. Con el botón "Crear a partir de esta" (disponible junto a cada canción generada) puedes usar los mismos nombres e historia para generar una nueva versión en otro género o duración, usando otro crédito de tu código.'
  },
  {
    q: '¿Qué pasa si no me gusta el resultado?',
    a: (
      <>
        Al ser contenido digital personalizado y de entrega inmediata no realizamos devoluciones de dinero, pero revisamos cada caso.{' '}
        <a href="#/reembolsos" className="text-purple-300 hover:text-white underline underline-offset-2">Lee nuestra política de reembolsos</a>.
      </>
    )
  },
  {
    q: '¿Mi canción es privada?',
    a: 'Sí. Tu historia, nombres y canción generada son completamente privados. No compartimos ni publicamos el contenido de nuestros clientes. Consulta nuestra Política de Privacidad para más detalles.'
  },
  {
    q: '¿Qué incluye cada plan?',
    a: 'Una Canción incluye 1 canción sin video. Pack 3 y Pack 5 incluyen video vertical para WhatsApp/Reels/TikTok, con más fotos y minutos de duración por canción — revisa el detalle completo en la tabla de Planes y Precios arriba.'
  },
  {
    q: '¿Puedo escuchar un ejemplo antes de comprar?',
    a: (
      <>
        Sí — en la sección{' '}
        <a href="#estilos" className="text-purple-300 hover:text-white underline underline-offset-2">Estilos</a>{' '}
        puedes escuchar demos reales generadas en cada género antes de elegir el tuyo.
      </>
    )
  },
  {
    q: '¿Mi código de acceso expira?',
    a: 'No. Tu código no tiene fecha de vencimiento — puedes usar tus créditos cuando quieras hasta agotarlos.'
  }
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
  const [style, setStyle] = useState('Balada Romántica');
  const [customStyle, setCustomStyle] = useState('');
  const [duration, setDuration] = useState(60);
  const [voiceGender, setVoiceGender] = useState('cualquiera');

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

  // Code history & Creations state
  const [myCodeSongs, setMyCodeSongs] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isCreationsModalOpen, setIsCreationsModalOpen] = useState(false);
  const [isSongVideoCreatorOpen, setIsSongVideoCreatorOpen] = useState(false);
  const [selectedSongForVideo, setSelectedSongForVideo] = useState(null);
  const [localSongs, setLocalSongs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('songcraft_history_songs') || '[]');
    } catch {
      return [];
    }
  });

  // Unified list of all creations for the CURRENTLY ACTIVE code — combines the
  // server's own history for this code (myCodeSongs, always authoritative) with
  // the local device cache, but only the cache entries that were actually made
  // with this same code. Without that filter, switching from one code to another
  // on the same device would keep showing the previous code's songs here, even
  // though this code itself has never generated any (a real bug: the "N
  // canciones creadas" badge didn't match the admin panel's per-code usage).
  const isSameCode = (song) =>
    Boolean(song?.code && accessCode && song.code.toUpperCase() === accessCode.toUpperCase());

  const allCreations = (() => {
    const map = new Map();
    localSongs.filter(isSameCode).forEach((s) => { if (s?.id) map.set(s.id, s); });
    myCodeSongs.forEach((s) => { if (s?.id) map.set(s.id, s); });
    if (generatedSong?.id && isSameCode(generatedSong)) map.set(generatedSong.id, generatedSong);
    return Array.from(map.values()).sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  })();

  // Voice Assistant Modal
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isInlineRecordingNames, setIsInlineRecordingNames] = useState(false);
  const [isInlineRecordingRefs, setIsInlineRecordingRefs] = useState(false);

  // 10-second preview state (real studio audio)
  const [playingPreviewGenre, setPlayingPreviewGenre] = useState(null);

  // "Explora Estilos" carousel: mood filter + page (6 genres per slide)
  const [stylesMood, setStylesMood] = useState('all');
  const [stylesPage, setStylesPage] = useState(0);
  const STYLES_PER_SLIDE = 6;
  const filteredGenrePresets = filterByMood(GENRE_PRESETS, stylesMood);
  const stylesPageCount = Math.max(1, Math.ceil(filteredGenrePresets.length / STYLES_PER_SLIDE));

  const handleStylesMoodChange = (mood) => {
    setStylesMood(mood);
    setStylesPage(0);
  };

  // Public showcase demos (real songs already generated)
  const [publicDemos, setPublicDemos] = useState([]);

  // Real generated demo (audio + the story that produced it) per genre, see
  // /api/genre-demos — the "Escuchar demo" button on each "Explora Estilos"
  // card plays this when available (falling back to a generic instrument-only
  // sample otherwise), and "Ver guía de creación" shows the story itself.
  const [genreDemos, setGenreDemos] = useState({});
  const [guideGenre, setGuideGenre] = useState(null); // the GENRE_PRESETS item currently shown in the guide modal

  // Hero sample audio state
  const [isPlayingHeroDemo, setIsPlayingHeroDemo] = useState(false);
  const heroAudioRef = useRef(null);

  // Validate stored code on initial load
  useEffect(() => {
    if (accessCode) {
      validateCode(accessCode);
    }
  }, []);

  // Load public showcase demos
  useEffect(() => {
    fetch('/api/demos')
      .then((res) => res.json())
      .then((data) => setPublicDemos(Array.isArray(data) ? data : []))
      .catch(() => setPublicDemos([]));
  }, []);

  // Load real per-genre demos for the "Explora Estilos" preview buttons
  useEffect(() => {
    fetch('/api/genre-demos')
      .then((res) => res.json())
      .then((data) => setGenreDemos(data && typeof data === 'object' ? data : {}))
      .catch(() => setGenreDemos({}));
  }, []);

  // Fetch my songs when code is valid
  useEffect(() => {
    if (codeInfo?.valid && accessCode) {
      fetchCodeHistory(accessCode);
    }
  }, [codeInfo?.valid, accessCode]);

  // Duration options are capped by the validated code's plan. If the customer had
  // picked a longer duration before entering a more limited code (e.g. switching
  // from a Pack 5 to a Plan Solo code), clamp the selection down so it stays valid.
  const maxDurationSec = codeInfo?.maxDurationSec || 300;
  const durationPresets = DURATION_PRESETS.filter((p) => p.value <= maxDurationSec);
  useEffect(() => {
    if (duration > maxDurationSec) {
      setDuration(maxDurationSec);
    }
  }, [maxDurationSec]);

  // Clean up audio previews on unmount
  useEffect(() => {
    return () => {
      stopAllAudioPreviews();
      if (heroAudioRef.current) {
        heroAudioRef.current.pause();
      }
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
      setCodeError('No pudimos conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.');
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

  // Called once a story-video finishes rendering, so it shows up right away next
  // to the audio in the results screen without needing a reload — patches every
  // local copy of that song (active player, "mis creaciones" cache) and refreshes
  // the server-backed history too. A song can hold several independent finished
  // videos (plan-dependent), so this APPENDS rather than overwrites.
  //
  // accountVideosUsed is spent per ACCOUNT, not per song, so it has to bump on
  // EVERY cached song object for this code — not just the one that got the new
  // video — or other songs' "can I create another?" gate would read stale.
  const patchWithNewVideo = (s, songFilename, videoUrl, videoExpiresAt) => {
    if (!s) return s;
    const bumpedAccountVideosUsed = (s.accountVideosUsed ?? 0) + 1;
    if (s.filename !== songFilename) {
      return { ...s, accountVideosUsed: bumpedAccountVideosUsed };
    }
    const existing = Array.isArray(s.videos)
      ? s.videos
      : s.videoUrl
        ? [{ url: s.videoUrl, expiresAt: s.videoExpiresAt }]
        : [];
    return {
      ...s,
      videos: [...existing, { url: videoUrl, expiresAt: videoExpiresAt }],
      accountVideosUsed: bumpedAccountVideosUsed
    };
  };

  const handleVideoReady = (songFilename, videoUrl, videoExpiresAt) => {
    const patch = (s) => patchWithNewVideo(s, songFilename, videoUrl, videoExpiresAt);

    setGeneratedSong((prev) => {
      const next = patch(prev);
      if (next && next !== prev) {
        localStorage.setItem('songcraft_active_song', JSON.stringify(next));
      }
      return next || prev;
    });

    setLocalSongs((prev) => {
      const next = prev.map(patch);
      localStorage.setItem('songcraft_history_songs', JSON.stringify(next));
      return next;
    });

    setSelectedSongForVideo((prev) => patch(prev) || prev);

    if (accessCode) fetchCodeHistory(accessCode);
  };

  // Toggle preview — a real generated demo for that genre when one exists
  // (see genreDemos), otherwise the generic instrument-only sample.
  const handleToggleGenrePreview = (e, genreId) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (playingPreviewGenre === genreId) {
      stopAllAudioPreviews();
      setPlayingPreviewGenre(null);
    } else {
      setPlayingPreviewGenre(genreId);
      playGenrePreview(genreId, () => {
        setPlayingPreviewGenre(null);
      }, genreDemos[genreId]?.audioUrl);
    }
  };

  // Toggle Hero Vocal Sample Preview
  const handleToggleHeroAudio = () => {
    if (!heroAudioRef.current) {
      heroAudioRef.current = new Audio('/api/demos/sample-audio'); // Or first public demo
    }

    const firstDemo = publicDemos[0];
    const src = firstDemo ? firstDemo.audioUrl : '/audio/demo-pedida.mp3';
    
    if (heroAudioRef.current.src !== src) {
      heroAudioRef.current.src = src;
    }

    if (isPlayingHeroDemo) {
      heroAudioRef.current.pause();
      setIsPlayingHeroDemo(false);
    } else {
      stopAllAudioPreviews();
      heroAudioRef.current.play()
        .then(() => setIsPlayingHeroDemo(true))
        .catch(() => {
          // If direct audio fails, fallback to synth preview
          handleToggleGenrePreview(null, 'balada');
          setIsPlayingHeroDemo(true);
        });

      heroAudioRef.current.onended = () => {
        setIsPlayingHeroDemo(false);
      };
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
    if (e && e.preventDefault) e.preventDefault();
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
          duration: duration,
          voiceGender: voiceGender
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Ocurrió un problema al generar la canción.');
      }

      setGeneratedSong(data.song);
      localStorage.setItem('songcraft_active_song', JSON.stringify(data.song));
      
      // Also save to all creations history
      try {
        const existing = JSON.parse(localStorage.getItem('songcraft_history_songs') || '[]');
        const updated = [data.song, ...existing.filter((s) => s.id !== data.song.id)];
        localStorage.setItem('songcraft_history_songs', JSON.stringify(updated));
        setLocalSongs(updated);
      } catch (e) {
        console.warn("Could not save to history", e);
      }

      // Refresh code validation & history
      validateCode(accessCode);

      // Scroll smoothly to the result — same anchor used everywhere else in
      // this file, so it lands correctly regardless of how tall the page is
      // on mobile's stacked layout (a hardcoded pixel offset previously missed).
      scrollToWizard();
    } catch (err) {
      console.error(err);
      setError(err.message || 'No pudimos conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetForNewSong = () => {
    setGeneratedSong(null);
    localStorage.removeItem('songcraft_active_song');
    setNames('');
    setReferences('');
    setVoiceGender('cualquiera');
    setError('');
  };

  // Reuses the dedication + story from a previously created song so the customer
  // can generate a new one in a different genre/duration without retyping everything.
  const handleCreateFromSong = (song) => {
    setGeneratedSong(null);
    localStorage.removeItem('songcraft_active_song');
    setNames(song?.names || '');
    setReferences(song?.references || '');
    setStyle(song?.style || 'Balada Romántica');
    setCustomStyle('');
    setDuration(song?.duration || 60);
    setVoiceGender(song?.voiceGender || 'cualquiera');
    setError('');
    scrollToWizard();
  };

  const scrollToWizard = () => {
    const el = document.getElementById('crear-cancion');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const selectPlan = () => {
    setIsPlanModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070913] text-gray-100 selection:bg-pink-500 selection:text-white relative overflow-hidden">
      
      {/* Background ambient lighting orbs with subtle float */}
      <div className="fixed top-12 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-float" />
      <div className="fixed top-96 right-10 w-[450px] h-[450px] bg-pink-600/10 rounded-full blur-[130px] pointer-events-none -z-10 animate-float-delayed" />
      <div className="fixed bottom-10 left-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApplyParsedData={handleApplyVoiceData}
      />

      {/* Access Code & Credits Status Bar right below the menu */}
      <AccessCodeTopBar
        accessCode={accessCode}
        setAccessCode={setAccessCode}
        codeInfo={codeInfo}
        codeError={codeError}
        isValidatingCode={isValidatingCode}
        validateCode={validateCode}
        createdSongsCount={allCreations.length}
        onOpenHistory={() => setIsCreationsModalOpen(true)}
      />

      {/* ============================================================ */}
      {/* SECTION 1: HERO SECTION                                     */}
      {/* ============================================================ */}
      <section id="hero" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline, Subtitle, CTAs & Social Proof */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Pill Badge with Sparkles */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider shadow-lg shadow-purple-950/40">
              <Sparkle className="w-3.5 h-3.5 text-pink-400" animation="animate-twinkle" />
              <span>MÚSICA PERSONALIZADA CON IA Y TOQUE HUMANO</span>
              <Sparkle className="w-2.5 h-2.5 text-purple-300" animation="animate-twinkle-delay-1" />
            </div>

            {/* H1 Main Title */}
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Convierte tu historia en una{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                  canción real
                </span>
                <Sparkle className="w-4 h-4 text-pink-300 absolute -top-2 -right-4" animation="animate-twinkle" />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-gray-300/90 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Escribe tu historia o habla con nosotros y creamos una canción única de calidad profesional para regalar o dedicar.
            </p>

            {/* CTAs Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                type="button"
                onClick={scrollToWizard}
                className="w-full sm:w-auto relative px-7 py-3.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-pink-500 hover:from-purple-500 hover:via-pink-500 hover:to-pink-400 text-white font-bold text-sm shadow-xl shadow-pink-900/40 hover:shadow-pink-600/50 hover:scale-105 active:scale-95 transition-all duration-300 shimmer-effect flex items-center justify-center gap-2.5"
              >
                <Sparkle className="w-4 h-4 text-pink-200" animation="animate-twinkle" />
                <span>Crear mi canción ahora</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('ejemplos');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-gray-900/80 hover:bg-gray-800 border border-gray-700/80 text-gray-200 hover:text-white font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 hover:border-gray-600"
              >
                <Play className="w-4 h-4 text-purple-400 fill-current" />
                <span>Escuchar ejemplos</span>
              </button>
            </div>

            {/* Metrics Bar */}
            <div className="pt-6 border-t border-gray-800/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center sm:text-left max-w-md mx-auto lg:mx-0">
              <div>
                <div className="text-xl sm:text-2xl font-black text-white">+500</div>
                <div className="text-xs text-gray-400 mt-0.5">canciones creadas</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-amber-400 flex items-center justify-center sm:justify-start gap-1">
                  <span>4.9</span>
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <div className="text-xs text-gray-400 mt-0.5">valoración media</div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-xl sm:text-2xl font-black text-teal-400">~5 min</div>
                <div className="text-xs text-gray-400 mt-0.5">tiempo de entrega</div>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual with Studio Vocalist & Floating Sample Pill */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl shadow-purple-950/60 group animate-float">
              
              {/* Studio Singer Image */}
              <img
                src="/images/hero-vocalista.avif"
                alt="Cantante en estudio SerenatIA"
                className="w-full h-[400px] sm:h-[460px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />

              {/* Glowing gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#090b16] via-transparent to-black/20 pointer-events-none" />

              {/* Floating Audio Preview Pill */}
              <div className="absolute bottom-5 left-4 right-4 sm:left-6 sm:right-6">
                <div
                  onClick={handleToggleHeroAudio}
                  className="glass-panel-glow p-3 sm:p-3.5 rounded-2xl border border-pink-500/40 shadow-xl cursor-pointer hover:border-pink-400 transition-all flex items-center justify-between gap-3 group/pill"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-pink-900/50 group-hover/pill:scale-105 transition-transform">
                      {isPlayingHeroDemo ? (
                        <Square className="w-4 h-4 fill-current animate-pulse" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Para Camila con amor</span>
                        <Sparkle className="w-2.5 h-2.5 text-pink-400" animation="animate-twinkle" />
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {isPlayingHeroDemo ? 'Reproduciendo muestra de estudio...' : '0:30 de muestra · Haz clic para oír'}
                      </div>
                    </div>
                  </div>

                  {/* Soundwave equalizer bars */}
                  <div className="flex items-end gap-1 h-5 px-1">
                    <div className={`w-1 bg-pink-500 rounded-full ${isPlayingHeroDemo ? 'animate-wave-1' : 'h-1.5'}`} />
                    <div className={`w-1 bg-purple-400 rounded-full ${isPlayingHeroDemo ? 'animate-wave-2' : 'h-3'}`} />
                    <div className={`w-1 bg-pink-400 rounded-full ${isPlayingHeroDemo ? 'animate-wave-3' : 'h-2'}`} />
                    <div className={`w-1 bg-indigo-400 rounded-full ${isPlayingHeroDemo ? 'animate-wave-4' : 'h-1.5'}`} />
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 2: CÓMO FUNCIONA (4 PASOS)                          */}
      {/* ============================================================ */}
      <section id="como-funciona" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800/60">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
            CÓMO FUNCIONA
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-1.5">
            De tu historia a una canción, en 5 pasos
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              step: '00',
              title: 'Elige tu plan y activa tu código',
              desc: 'Compra un código de acceso según cuántas canciones necesites y actívalo en la barra superior.',
              icon: Key,
              color: 'text-amber-400',
              border: 'border-amber-500/20',
              onClick: () => document.getElementById('precios')?.scrollIntoView({ behavior: 'smooth' })
            },
            {
              step: '01',
              title: 'Elige el género',
              desc: 'Balada, banda, nana de dormir, reggaetón, salsa y más de 13 estilos.',
              icon: BrandSongIcon,
              color: 'text-purple-400',
              border: 'border-purple-500/20'
            },
            {
              step: '02',
              title: 'Cuéntanos la historia',
              desc: 'Escribe los nombres, recuerdos y anécdotas, o díctalo directamente con voz.',
              icon: BrandStoryIcon,
              color: 'text-pink-400',
              border: 'border-pink-500/20'
            },
            {
              step: '03',
              title: 'La IA compone',
              desc: 'Nuestros modelos afinados estructuran letra, acordes, armonías y voces de estudio.',
              icon: BrandAiIcon,
              color: 'text-indigo-400',
              border: 'border-indigo-500/20'
            },
            {
              step: '04',
              title: 'Escucha y descarga',
              desc: 'Recibe tu canción en MP3 de alta fidelidad, lista para enviar por WhatsApp o regalar.',
              icon: BrandDownloadIcon,
              color: 'text-emerald-400',
              border: 'border-emerald-500/20'
            }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                onClick={item.onClick}
                className={`glass-panel p-6 rounded-3xl border ${item.border} hover:border-gray-600 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 ${item.onClick ? 'cursor-pointer' : ''}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform`} />
                    </div>
                    <span className="text-sm font-mono font-bold text-gray-500 group-hover:text-gray-300">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 3: CREA TU CANCIÓN (EL WIZARD O REPRODUCTOR)        */}
      {/* ============================================================ */}
      <section id="crear-cancion" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* If song is already generated */}
        {generatedSong ? (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>¡Tu canción personalizada está lista para escuchar y descargar!</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleCreateFromSong(generatedSong)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:text-purple-200 text-xs font-semibold transition-all"
                  title="Reutiliza los mismos nombres e historia para crear una nueva canción en otro género o duración"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Crear a partir de esta</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetForNewSong}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Crear otra canción</span>
                </button>
              </div>
            </div>

            <SongPlayer
              song={generatedSong}
              title={`Canción para ${generatedSong.names}`}
              subtitle={`Estilo: ${generatedSong.style} • Duración: ${generatedSong.duration}s`}
              onOpenVideoCreator={(s) => {
                setSelectedSongForVideo(s);
                setIsSongVideoCreatorOpen(true);
              }}
            />

            <div className="p-4 rounded-2xl bg-gray-950/60 border border-gray-800 text-xs text-gray-400 text-center">
              💾 <strong>Tu canción permanece guardada en esta pantalla:</strong> Puedes recargar o salir de la página y volver cuando quieras.
            </div>
          </div>
        ) : (
          <SongWizard
            names={names}
            setNames={setNames}
            references={references}
            setReferences={setReferences}
            style={style}
            setStyle={setStyle}
            customStyle={customStyle}
            setCustomStyle={setCustomStyle}
            duration={duration}
            setDuration={setDuration}
            voiceGender={voiceGender}
            setVoiceGender={setVoiceGender}
            accessCode={accessCode}
            setAccessCode={setAccessCode}
            codeInfo={codeInfo}
            codeError={codeError}
            isValidatingCode={isValidatingCode}
            validateCode={validateCode}
            handleSubmit={handleSubmit}
            isGenerating={isGenerating}
            generationStep={generationStep}
            error={error}
            handleSingleFieldVoice={handleSingleFieldVoice}
            isInlineRecordingNames={isInlineRecordingNames}
            isInlineRecordingRefs={isInlineRecordingRefs}
            setIsVoiceModalOpen={setIsVoiceModalOpen}
            handleToggleGenrePreview={handleToggleGenrePreview}
            playingPreviewGenre={playingPreviewGenre}
            genrePresets={GENRE_PRESETS}
            durationPresets={durationPresets}
            genreDemos={genreDemos}
            onOpenGenreGuide={setGuideGenre}
          />
        )}

      </section>

      {/* ============================================================ */}
      {/* SECTION 4: EXPLORA ESTILOS                                  */}
      {/* ============================================================ */}
      <section id="estilos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800/60">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
              EXPLORA ESTILOS
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-1.5">
              Elige el estilo perfecto
            </h2>
          </div>
          <button
            type="button"
            onClick={scrollToWizard}
            className="text-xs font-semibold text-purple-300 hover:text-pink-300 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Ver todos en el formulario</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mood filter pills */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {MOOD_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => handleStylesMoodChange(filter.value)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                stylesMood === filter.value
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-transparent text-white shadow-md shadow-purple-900/40'
                  : 'bg-gray-900/80 border-gray-800 text-gray-300 hover:text-white hover:border-gray-600'
              }`}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>

        {/* Genre Carousel - 6 styles per slide */}
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGenrePresets
              .slice(stylesPage * STYLES_PER_SLIDE, stylesPage * STYLES_PER_SLIDE + STYLES_PER_SLIDE)
              .map((item) => {
                const isPlaying = playingPreviewGenre === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setStyle(item.name);
                      scrollToWizard();
                    }}
                    className={`relative rounded-3xl overflow-hidden border border-gray-800/90 h-52 group cursor-pointer hover:border-purple-500/50 transition-all duration-300 shadow-xl ${
                      item.image ? '' : 'bg-gradient-to-br from-gray-900 to-gray-950 flex flex-col items-center justify-center'
                    }`}
                  >
                    {item.image ? (
                      <>
                        {/* Background Image with Zoom on hover */}
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                        />
                        {/* Dark Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 flex flex-col justify-between" />
                      </>
                    ) : (
                      <span className="text-5xl opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">{item.icon}</span>
                    )}

                    {/* Top Badge & Demo Buttons */}
                    <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                      <span className="text-lg">{item.icon}</span>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleToggleGenrePreview(e, item.id)}
                          className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                            isPlaying
                              ? 'bg-amber-500 text-gray-950 border-amber-400 animate-pulse'
                              : 'bg-black/70 text-amber-300 border-amber-400/30 hover:bg-amber-500/20'
                          }`}
                        >
                          {isPlaying ? (
                            <>
                              <Square className="w-2.5 h-2.5 fill-current" />
                              <span>Parar</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>{genreDemos[item.id] ? 'Escuchar demo' : 'Demo 10s'}</span>
                            </>
                          )}
                        </button>

                        {genreDemos[item.id] && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGuideGenre(item);
                            }}
                            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border bg-black/70 text-purple-300 border-purple-400/30 hover:bg-purple-500/20 transition-all"
                          >
                            <FileText className="w-2.5 h-2.5" />
                            <span>Ver guía de creación</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bottom Content */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-300 line-clamp-1 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Carousel Controls */}
          {stylesPageCount > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                type="button"
                onClick={() => setStylesPage((p) => (p - 1 + stylesPageCount) % stylesPageCount)}
                className="w-10 h-10 rounded-full bg-gray-900/90 border border-gray-700 flex items-center justify-center text-gray-300 hover:text-white hover:border-purple-500/60 transition-all"
                aria-label="Estilos anteriores"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: stylesPageCount }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setStylesPage(i)}
                    className="p-2 -m-1"
                    aria-label={`Ir a la página ${i + 1}`}
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all ${
                        i === stylesPage ? 'w-6 bg-gradient-to-r from-purple-500 to-pink-500' : 'w-1.5 bg-gray-700 hover:bg-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setStylesPage((p) => (p + 1) % stylesPageCount)}
                className="w-10 h-10 rounded-full bg-gray-900/90 border border-gray-700 flex items-center justify-center text-gray-300 hover:text-white hover:border-purple-500/60 transition-all"
                aria-label="Más estilos"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 5: MUESTRAS REALES                                  */}
      {/* ============================================================ */}
      {publicDemos.length > 0 && (
        <section id="ejemplos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800/60">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
              MUESTRAS REALES
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-1.5">
              Escucha ejemplos reales
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto mt-2">
              Canciones generadas y masterizadas con historias auténticas de nuestros usuarios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {publicDemos.map((demo) => {
              const meta = PUBLIC_DEMO_META[demo.demoId] || {
                title: demo.style,
                subtitle: demo.names,
                icon: Music2,
                image: '/images/hero-vocalista.avif'
              };

              return (
                <div
                  key={demo.demoId}
                  className="glass-panel rounded-3xl border border-gray-800/80 overflow-hidden flex flex-col group hover:border-purple-500/40 transition-all duration-300"
                >
                  {/* Card Cover Photo */}
                  <div className="relative h-44 w-full overflow-hidden">
                    <img
                      src={meta.image}
                      alt={meta.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d111e] via-transparent to-transparent" />
                    <span className="absolute top-3 right-3 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-gray-300 border border-white/10">
                      {demo.duration} seg
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                    <div>
                      <div className="text-base font-bold text-white mb-0.5">{meta.title}</div>
                      <div className="text-xs text-purple-300 font-medium">{demo.style}</div>
                      <p className="text-xs text-gray-400 mt-2.5 line-clamp-3 leading-relaxed">
                        "{demo.references}"
                      </p>
                    </div>

                    {/* Audio Player Component */}
                    <div className="pt-2">
                      <audio controls src={demo.audioUrl} className="w-full h-9" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* SECTION 6: PLANES Y PRECIOS                                 */}
      {/* ============================================================ */}
      <section id="precios" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800/60">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
            PLANES Y PRECIOS
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-1.5">
            Elige cómo quieres sorprender
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto mt-2">
            Tarifas únicas y transparentes. Sin suscripciones ocultas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          
          {/* Plan Básico */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-gray-800 flex flex-col justify-between hover:border-gray-700 transition-all">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                UNA CANCIÓN
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white mt-2">
                $20.000 <span className="text-xs font-normal text-gray-400">COP</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Ideal para un detalle inolvidable, cumpleaños o sorpresa.
              </p>

              <ul className="mt-6 space-y-3 text-xs text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>1 canción completa con letra y voz</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Hasta 2 minutos de duración</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Sin video</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Descarga en MP3 de alta fidelidad</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => selectPlan()}
              className="mt-8 w-full py-3 rounded-2xl bg-gray-900 hover:bg-gray-800 text-gray-200 hover:text-white font-semibold text-xs border border-gray-700 transition-all"
            >
              Elegir plan
            </button>
          </div>

          {/* Plan Recomendado (MÁS POPULAR) */}
          <div className="relative glass-panel-glow p-6 sm:p-7 rounded-3xl border-2 border-purple-500/60 shadow-2xl shadow-purple-950/70 flex flex-col justify-between scale-[1.03] z-10">
            {/* Sparkle badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-pink-500 text-white text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1.5">
              <Sparkle className="w-2.5 h-2.5 text-yellow-200" animation="animate-twinkle" />
              <span>MÁS POPULAR</span>
              <Sparkle className="w-2.5 h-2.5 text-pink-200" animation="animate-twinkle-delay-1" />
            </div>

            <div>
              <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">
                PACK 3 CANCIONES
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white mt-2">
                $50.000 <span className="text-xs font-normal text-gray-400">COP</span>
              </div>
              <p className="text-xs text-gray-300 mt-2">
                La mejor opción para probar distintos géneros o dedicar a varias personas.
              </p>

              <ul className="mt-6 space-y-3 text-xs text-gray-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400 stroke-[3]" />
                  <span><strong>3 canciones</strong> completas e independientes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400 stroke-[3]" />
                  <span>Hasta 3 minutos de duración por canción</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400 stroke-[3]" />
                  <span>Con video incluido (1 sola foto)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pink-400 stroke-[3]" />
                  <span>Descarga directa MP3 y MP4</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => selectPlan()}
              className="mt-8 w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-pink-500 hover:from-purple-500 hover:via-pink-500 hover:to-pink-400 text-white font-bold text-xs shadow-lg shadow-pink-900/40 hover:scale-[1.02] transition-all shimmer-effect"
            >
              Elegir plan
            </button>
          </div>

          {/* Plan Premium */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-gray-800 flex flex-col justify-between hover:border-gray-700 transition-all">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                PACK 5 CANCIONES
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white mt-2">
                $70.000 <span className="text-xs font-normal text-gray-400">COP</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Para familias, creadores o regalos múltiples con máxima personalización.
              </p>

              <ul className="mt-6 space-y-3 text-xs text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span><strong>5 canciones</strong> personalizadas con IA</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Hasta 4 minutos de duración por canción</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Con video incluido (hasta 5 fotos)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Acceso a masterización de estudio</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => selectPlan()}
              className="mt-8 w-full py-3 rounded-2xl bg-gray-900 hover:bg-gray-800 text-gray-200 hover:text-white font-semibold text-xs border border-gray-700 transition-all"
            >
              Elegir plan
            </button>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 6B: PREGUNTAS FRECUENTES                            */}
      {/* ============================================================ */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-800/60">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
            PREGUNTAS FRECUENTES
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
            Todo lo que necesitas saber
          </h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = faqOpenIndex === i;
            return (
              <div
                key={item.q}
                className="glass-panel rounded-2xl border border-gray-800 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setFaqOpenIndex(isOpen ? null : i)}
                  className="w-full min-h-11 px-5 py-4 flex items-center justify-between gap-3 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-white">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-gray-400 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 7: BANNER FINAL CTA                                 */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-800 via-pink-600 to-indigo-700 p-8 sm:p-12 text-white shadow-2xl shadow-pink-950/60 shimmer-effect">
          
          {/* Sparkles on Banner */}
          <SparkleCluster className="top-4 left-6" />
          <SparkleCluster className="bottom-4 right-10" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                ¿Listo para sorprender a alguien especial?
              </h2>
              <p className="text-xs sm:text-sm text-pink-100/90 mt-2">
                Escribe su canción hoy y tenla lista en minutos para WhatsApp o regalo.
              </p>
            </div>

            <button
              type="button"
              onClick={scrollToWizard}
              className="px-8 py-3.5 rounded-full bg-white hover:bg-gray-100 text-gray-950 font-bold text-xs sm:text-sm shadow-xl hover:scale-105 active:scale-95 transition-all flex-shrink-0"
            >
              Crear mi canción →
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 8: FOOTER                                           */}
      {/* ============================================================ */}
      <footer className="border-t border-gray-900 bg-[#05070d] py-12 text-gray-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            
            {/* Column 1: Logo & Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <BrandMark className="w-5 h-5" />
                <span className="text-lg text-white"><span className="font-bold">Serenat</span><span className="font-light">IA</span></span>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                Canciones personalizadas con Inteligencia Artificial y toque humano para momentos inolvidables.
              </p>
            </div>

            {/* Column 2: Contacto */}
            <div>
              <div className="font-semibold text-white mb-3">Contacto</div>
              <ul className="space-y-2 text-gray-400">
                <li>soporte@serenatia.com</li>
                <li>WhatsApp: +57 300 000 0000</li>
                <li>Lunes a Domingo, 24/7</li>
              </ul>
            </div>

            {/* Column 3: Ayuda */}
            <div>
              <div className="font-semibold text-white mb-3">Ayuda</div>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#como-funciona" className="hover:text-white">Cómo funciona</a></li>
                <li><a href="#faq" className="hover:text-white">Preguntas frecuentes</a></li>
                <li><a href="#estilos" className="hover:text-white">Guía de géneros</a></li>
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div>
              <div className="font-semibold text-white mb-3">Legal</div>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#/terminos" className="hover:text-white transition-colors">Términos y condiciones</a></li>
                <li><a href="#/privacidad" className="hover:text-white transition-colors">Política de privacidad</a></li>
                <li><a href="#/reembolsos" className="hover:text-white transition-colors">Política de reembolsos</a></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
            <p>© {new Date().getFullYear()} SerenatIA • Todos los derechos reservados.</p>
            <p>Música generada con IA para uso personal y celebraciones.</p>
          </div>
        </div>
      </footer>

      {/* User Creations Modal (Ver todas las canciones creadas) */}
      <UserCreationsModal
        isOpen={isCreationsModalOpen}
        onClose={() => setIsCreationsModalOpen(false)}
        songs={allCreations}
        activeCode={accessCode}
        onSelectSongForPlayer={(s) => {
          setGeneratedSong(s);
          localStorage.setItem('songcraft_active_song', JSON.stringify(s));
          window.scrollTo({ top: 400, behavior: 'smooth' });
        }}
        onOpenVideoCreator={(s) => {
          setSelectedSongForVideo(s);
          setIsSongVideoCreatorOpen(true);
        }}
      />

      {/* Vertical Video Creator with Remotion Modal */}
      <SongVideoCreatorModal
        isOpen={isSongVideoCreatorOpen}
        onClose={() => setIsSongVideoCreatorOpen(false)}
        song={selectedSongForVideo || generatedSong}
        accessCode={accessCode}
        onVideoReady={handleVideoReady}
      />

      {/* "Ver guía de creación" — shows the story behind a genre's real demo */}
      <GenreGuideModal
        isOpen={!!guideGenre}
        onClose={() => setGuideGenre(null)}
        genre={guideGenre}
        demo={guideGenre ? genreDemos[guideGenre.id] : null}
        onUseStyle={() => {
          if (guideGenre) setStyle(guideGenre.name);
          setGuideGenre(null);
          scrollToWizard();
        }}
      />

      {/* Plan Info Modal — "Habla con quien te lo compartió" */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsPlanModalOpen(false)}
          />
          <div className="relative w-full max-w-sm glass-panel-glow rounded-3xl p-8 text-center space-y-5 animate-[fadeIn_0.2s_ease-out]">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsPlanModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>

            {/* Emoji */}
            <div className="text-6xl">🤝</div>

            {/* Message */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                ¡Genial que te interese!
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Habla con la persona que te compartió este enlace para obtener tu <strong className="text-purple-300">código de acceso</strong> y empezar a crear tu canción personalizada.
              </p>
            </div>

            {/* Action */}
            <button
              type="button"
              onClick={() => {
                setIsPlanModalOpen(false);
                scrollToWizard();
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-900/40 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Ya tengo mi código →
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
