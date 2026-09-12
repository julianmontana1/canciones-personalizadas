import React, { useState, useRef, useEffect } from 'react';
import {
  Check, Edit2, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight,
  Sparkles, Mic, Clock, Key, AlertTriangle, RefreshCw, FileText,
  Play, Square, Mars, Venus, VenusAndMars, Shuffle, Wand2
} from 'lucide-react';
import Sparkle, { SparkleCluster } from './Sparkle';
import { MOOD_FILTERS, filterByMood } from '../utils/moodFilters';

export default function SongWizard({
  names,
  setNames,
  references,
  setReferences,
  style,
  setStyle,
  customStyle,
  setCustomStyle,
  duration,
  setDuration,
  voiceGender,
  setVoiceGender,
  accessCode,
  setAccessCode,
  codeInfo,
  codeError,
  isValidatingCode,
  validateCode,
  handleSubmit,
  isGenerating,
  generationStep,
  error,
  handleSingleFieldVoice,
  isInlineRecordingNames,
  isInlineRecordingRefs,
  setIsVoiceModalOpen,
  handleToggleGenrePreview,
  playingPreviewGenre,
  genrePresets = [],
  durationPresets = [],
  genreDemos = {},
  onOpenGenreGuide
}) {
  // Step 1: Dedicatoria (Nombres)
  // Step 2: Género Musical
  // Step 3: Historia y Recuerdos
  // Step 4: Duración, Código y Generar
  const [currentStep, setCurrentStep] = useState(1);
  const [genreMood, setGenreMood] = useState('all');
  const genreSliderRef = useRef(null);
  const filteredGenrePresets = filterByMood(genrePresets, genreMood);

  // The currently chosen genre's real demo (if one exists) — used to offer a
  // concrete "how to write your story" example right where it matters, in
  // Step 2 (genre) and Step 3 (story), not just on the marketing gallery.
  const selectedGenrePreset = genrePresets.find((p) => p.name === style);
  const selectedGenreDemo = selectedGenrePreset ? genreDemos[selectedGenrePreset.id] : null;

  // Mobile-only dot pagination for the genre slider (prev/next arrows are
  // hidden below `sm:`, so this is the only position feedback on a phone).
  const [genrePage, setGenrePage] = useState(0);
  const [genrePageCount, setGenrePageCount] = useState(1);

  const updateGenrePageCount = () => {
    const el = genreSliderRef.current;
    if (!el || el.clientWidth === 0) return;
    setGenrePageCount(Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth)));
  };

  useEffect(() => {
    updateGenrePageCount();
    window.addEventListener('resize', updateGenrePageCount);
    return () => window.removeEventListener('resize', updateGenrePageCount);
  }, [filteredGenrePresets]);

  const handleGenreScroll = () => {
    const el = genreSliderRef.current;
    if (!el || el.clientWidth === 0) return;
    setGenrePage(Math.round(el.scrollLeft / el.clientWidth));
  };

  const scrollGenres = (direction) => {
    if (genreSliderRef.current) {
      genreSliderRef.current.scrollBy({ left: direction * 300, behavior: 'smooth' });
    }
  };

  const goToGenrePage = (page) => {
    const el = genreSliderRef.current;
    if (el) el.scrollTo({ left: page * el.clientWidth, behavior: 'smooth' });
  };

  const handleGenreMoodChange = (mood) => {
    setGenreMood(mood);
    if (genreSliderRef.current) {
      genreSliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  // "Mejorar mi idea": enriches the story with narrative direction for the chosen
  // genre. Keeps the previous text so the customer can undo it.
  const [isEnhancingIdea, setIsEnhancingIdea] = useState(false);
  const [storyBeforeEnhance, setStoryBeforeEnhance] = useState(null);
  const [enhanceError, setEnhanceError] = useState('');

  const handleEnhanceIdea = async () => {
    if (isEnhancingIdea || !references.trim()) return;
    setIsEnhancingIdea(true);
    setEnhanceError('');

    try {
      const res = await fetch('/api/enhance-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story: references, style: customStyle || style })
      });
      const data = await res.json();

      if (!res.ok) {
        setEnhanceError(data.error || 'No se pudo mejorar la idea.');
        return;
      }
      if (data.changed) {
        setStoryBeforeEnhance(references);
        setReferences(data.enhanced);
      }
    } catch (err) {
      setEnhanceError('No se pudo conectar con el servidor.');
    } finally {
      setIsEnhancingIdea(false);
    }
  };

  const handleUndoEnhance = () => {
    if (storyBeforeEnhance === null) return;
    setReferences(storyBeforeEnhance);
    setStoryBeforeEnhance(null);
  };

  // Quick next step label
  const getNextStepLabel = () => {
    switch (currentStep) {
      case 1:
        return 'Siguiente: el género';
      case 2:
        return 'Siguiente: la historia';
      case 3:
        return 'Siguiente: duración y listo';
      case 4:
        return 'Generar mi canción';
      default:
        return 'Siguiente';
    }
  };

  const [stepError, setStepError] = useState('');
  useEffect(() => setStepError(''), [currentStep]);

  const handleNext = () => {
    if (currentStep === 1 && !names.trim()) {
      setStepError('Por favor ingresa para quién es la canción');
      return;
    }
    setStepError('');
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Trigger submit
      handleSubmit({ preventDefault: () => {}, stopPropagation: () => {} });
    }
  };

  const handleBack = () => {
    setStepError('');
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const isStep1Done = Boolean(names.trim());
  const isStep2Done = Boolean(style);
  const isStep3Done = Boolean(references.trim());

  const loadingSteps = [
    'Verificando código y conectando con la IA...',
    'Estructurando letra, métrica y rimas personalizadas...',
    'Sintetizando melodía e instrumentación de estudio...',
    'Masterizando audio final en alta fidelidad (MP3)...'
  ];

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl wizard-box p-6 sm:p-8 text-white relative transition-all duration-300">
      
      {/* Sparkle decorative accents */}
      <SparkleCluster className="top-4 right-8" />
      <Sparkle className="w-3 h-3 text-purple-300 absolute bottom-6 left-6" animation="animate-twinkle-delay-2" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>Crea tu canción</span>
            <Sparkle className="w-4 h-4 text-pink-400" animation="animate-twinkle" />
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Un paso a la vez: así nadie se pierde ni deja el formulario a medias.
          </p>
        </div>

        {/* Step Badge */}
        <div className="px-3 py-1 rounded-full bg-gray-900/90 border border-gray-800 text-xs font-semibold text-gray-300 flex-shrink-0">
          Paso {currentStep} de 4
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 my-6">
        {[1, 2, 3, 4].map((stepNumber) => {
          const isActive = currentStep === stepNumber;
          const isPassed = currentStep > stepNumber;
          return (
            <div
              key={stepNumber}
              onClick={() => setCurrentStep(stepNumber)}
              className="py-4 -my-4 cursor-pointer"
            >
              <div
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 relative overflow-hidden ${
                  isActive || isPassed
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-sm shadow-pink-500/50'
                    : 'bg-gray-800/80 hover:bg-gray-700'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Message if any */}
      {(stepError || error) && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{stepError || error}</span>
        </div>
      )}

      {/* Accordion / Step Content List */}
      <div className="space-y-4 mb-8">

        {/* PASO 1: Dedicatoria / Nombres */}
        {currentStep === 1 ? (
          <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/40 shadow-lg shadow-purple-950/20 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-purple-400">
                PASO 1 · AHORA
              </span>
              <button
                type="button"
                onClick={() => handleSingleFieldVoice('names')}
                className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                  isInlineRecordingNames
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-gray-900/80 text-gray-300 hover:text-purple-300 border-gray-700'
                }`}
              >
                <Mic className="w-3 h-3" />
                <span>{isInlineRecordingNames ? 'Escuchando...' : 'Dictar por voz'}</span>
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mb-2">
              ¿A quién va dedicada la canción?
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Escribe el nombre o parentesco (ej: "Para mi novia Camila", "Para Don Roberto en sus 60 años", "Para mi bebé Sofía").
            </p>

            <input
              type="text"
              value={names}
              onChange={(e) => setNames(e.target.value)}
              placeholder="Ej: Para Camila con amor / Para mis padres Pedro y Rosa"
              className="w-full px-4 py-3 bg-[#0d1020] border border-gray-700/80 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              autoFocus
            />
          </div>
        ) : (
          <div
            onClick={() => setCurrentStep(1)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              isStep1Done
                ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isStep1Done ? 'bg-emerald-500 text-gray-950 font-bold' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {isStep1Done ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-wider uppercase text-emerald-400">
                  PASO 1 · {isStep1Done ? 'LISTO' : 'PENDIENTE'}
                </div>
                <div className="text-sm font-semibold text-gray-200">
                  {names ? names : 'Dedicatoria y nombres'}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* PASO 2: Selección de Género */}
        {currentStep === 2 ? (
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0f1224]/80 border border-purple-500/40 shadow-xl shadow-purple-950/20 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold tracking-wider uppercase text-purple-400">
                PASO 2 · AHORA
              </span>
              <span className="hidden sm:inline text-[11px] text-gray-400">
                Elige el ritmo que mejor exprese tus sentimientos
              </span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base sm:text-lg font-bold text-white">
                ¿Qué género quieres?
              </h3>
              <span className="text-[11px] text-gray-500 hidden sm:inline">Desliza para ver los estilos →</span>
            </div>

            {/* Mood filter pills */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {MOOD_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => handleGenreMoodChange(filter.value)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                    genreMood === filter.value
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-transparent text-white shadow-sm shadow-purple-900/40'
                      : 'bg-gray-900/80 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
                >
                  <span>{filter.icon}</span>
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>

            {/* Genre Slider - filtered styles in one swipeable row */}
            <div className="relative">
              <button
                type="button"
                onClick={() => scrollGenres(-1)}
                className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-gray-900/95 border border-gray-700 items-center justify-center text-gray-300 hover:text-white hover:border-gray-500 shadow-lg"
                aria-label="Ver géneros anteriores"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                ref={genreSliderRef}
                onScroll={handleGenreScroll}
                className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-1 px-1"
              >
                {filteredGenrePresets.length === 0 && (
                  <p className="text-xs text-gray-500 py-4 px-1">No hay estilos en esta categoría todavía.</p>
                )}
                {filteredGenrePresets.map((preset) => {
                  const isPlaying = playingPreviewGenre === preset.id;
                  const isSelected = style === preset.name && !customStyle;
                  const hasRealDemo = Boolean(genreDemos[preset.id]);

                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setStyle(preset.name);
                        setCustomStyle('');
                      }}
                      style={preset.image ? {
                        backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.15)), url(${preset.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      } : undefined}
                      className={`relative flex-shrink-0 snap-start w-32 sm:w-36 h-36 p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between select-none group ${
                        preset.image ? '' : 'bg-gray-900/70'
                      } ${
                        isSelected
                          ? 'border-pink-500 shadow-lg shadow-pink-900/30 ring-2 ring-pink-500/40 scale-[1.02]'
                          : 'border-white/10 hover:border-gray-500 hover:scale-[1.01]'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center text-white shadow-md shadow-pink-900/50 animate-fadeIn">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-lg">{preset.icon}</span>
                        <button
                          type="button"
                          onClick={(e) => handleToggleGenrePreview(e, preset.id)}
                          className={`p-2 rounded-lg border flex-shrink-0 transition-all ${
                            isPlaying
                              ? 'bg-amber-500 text-gray-950 border-amber-400 animate-pulse'
                              : 'bg-black/40 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                          title={hasRealDemo ? 'Escuchar canción de ejemplo' : 'Escuchar muestra de instrumentos de 10 segundos'}
                        >
                          {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                        </button>
                      </div>

                      <div className="font-bold text-xs text-white leading-tight line-clamp-2">
                        {preset.name}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollGenres(1)}
                className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-gray-900/95 border border-gray-700 items-center justify-center text-gray-300 hover:text-white hover:border-gray-500 shadow-lg"
                aria-label="Ver más géneros"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-2 text-[11px] text-gray-500 sm:hidden">Desliza para ver los estilos →</p>

            {genrePageCount > 1 && (
              <div className="flex sm:hidden items-center justify-center gap-1 mt-1">
                {Array.from({ length: genrePageCount }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goToGenrePage(i)}
                    className="p-2 -m-1"
                    aria-label={`Ir a la página ${i + 1} de estilos`}
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all ${
                        i === genrePage ? 'w-6 bg-gradient-to-r from-purple-500 to-pink-500' : 'w-1.5 bg-gray-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}

            {selectedGenreDemo && !customStyle && (
              <button
                type="button"
                onClick={() => onOpenGenreGuide?.(selectedGenrePreset)}
                className="mt-3 w-full min-h-11 flex items-center justify-center gap-1.5 px-3 rounded-xl border border-purple-500/30 bg-purple-950/20 text-purple-300 hover:bg-purple-500/10 text-xs font-semibold transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ver guía de creación de {selectedGenrePreset.name}</span>
              </button>
            )}

            {/* Custom style free input */}
            <div className="mt-4 pt-3 border-t border-gray-800/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-gray-400">¿No encuentras el tuyo? Escríbelo:</span>
                {customStyle && (
                  <span className="text-[11px] text-pink-300 bg-pink-950/40 px-2 py-0.5 rounded-full border border-pink-500/30">
                    Estilo libre: {customStyle}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
                placeholder="Ej. Vallenato nostálgico, Corrido tumbado, Bolero trío..."
                className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

          </div>
        ) : (
          <div
            onClick={() => setCurrentStep(2)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              isStep2Done
                ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isStep2Done ? 'bg-emerald-500 text-gray-950 font-bold' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {isStep2Done ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-wider uppercase text-emerald-400">
                  PASO 2 · {isStep2Done ? 'LISTO' : 'PENDIENTE'}
                </div>
                <div className="text-sm font-semibold text-gray-200">
                  Género: {customStyle || style || 'No seleccionado'}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* PASO 3: Historia y Recuerdos */}
        {currentStep === 3 ? (
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0f1224]/80 border border-pink-500/40 shadow-xl shadow-pink-950/20 transition-all">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-pink-400">
                PASO 3 · AHORA
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:brightness-110 shadow-sm transition-all"
                >
                  <Sparkles className="w-3 h-3 text-amber-200" />
                  <span className="hidden sm:inline">Asistente IA por Voz</span>
                  <span className="sm:hidden">Asistente IA</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSingleFieldVoice('refs')}
                  className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border transition-all ${
                    isInlineRecordingRefs
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : 'bg-gray-900/80 text-gray-300 hover:text-pink-300 border-gray-700'
                  }`}
                >
                  <Mic className="w-3 h-3" />
                  <span>{isInlineRecordingRefs ? 'Grabando...' : 'Dictar'}</span>
                </button>
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
              Cuéntanos la historia
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Detalles que quieras en la letra: anécdotas cómicas o emotivas, apodos, frases favoritas, fechas o lugares especiales.
            </p>

            <textarea
              value={references}
              onChange={(e) => setReferences(e.target.value)}
              onFocus={(e) => {
                const target = e.target;
                setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
              }}
              rows={4}
              placeholder="Ej: Nos conocimos en la universidad bajo la lluvia. Siempre toma café frío. Le encantan los viajes a la playa y su perro Rocky. Quiero decirle que gracias por estar en mis momentos más difíciles..."
              className="w-full px-4 py-3 bg-[#0d1020] border border-gray-700/80 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all resize-none"
              autoFocus
            />

            {/* Enhance idea */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleEnhanceIdea}
                disabled={isEnhancingIdea || !references.trim()}
                title={!references.trim() ? 'Escribe primero tu idea' : 'Añade dirección narrativa según el género elegido'}
                className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-200 hover:from-amber-500/30 hover:to-yellow-500/30 hover:text-amber-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Wand2 className={`w-3.5 h-3.5 ${isEnhancingIdea ? 'animate-spin' : ''}`} />
                <span>{isEnhancingIdea ? 'Mejorando...' : 'Mejorar mi idea'}</span>
              </button>

              {storyBeforeEnhance !== null && (
                <button
                  type="button"
                  onClick={handleUndoEnhance}
                  className="text-[11px] text-gray-400 hover:text-white underline underline-offset-2 transition-colors"
                >
                  Deshacer
                </button>
              )}

              {selectedGenreDemo && (
                <button
                  type="button"
                  onClick={() => onOpenGenreGuide?.(selectedGenrePreset)}
                  className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-purple-950/30 border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ver ejemplo de historia</span>
                </button>
              )}

              <span className="text-[11px] text-gray-500">
                Le da forma de canción a tu idea según el género
              </span>
            </div>

            {enhanceError && (
              <p className="mt-1.5 text-[11px] text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>{enhanceError}</span>
              </p>
            )}

            {/* Quick Inspiration Tags */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400">
              <span className="text-gray-500">Ideas rápidas:</span>
              {[
                'Cómo nos conocimos',
                'Un viaje inolvidable',
                'Sus frases típicas',
                'Agradecimiento sincero',
                'Un apodo cariñoso'
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setReferences((prev) => (prev ? `${prev} · ${tag}: ` : `${tag}: `))}
                  className="px-2 py-0.5 rounded-md bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            onClick={() => setCurrentStep(3)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              isStep3Done
                ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isStep3Done ? 'bg-emerald-500 text-gray-950 font-bold' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {isStep3Done ? <Check className="w-4 h-4 stroke-[3]" /> : '3'}
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-wider uppercase text-emerald-400">
                  PASO 3 · {isStep3Done ? 'LISTO' : 'PENDIENTE'}
                </div>
                <div className="text-sm font-semibold text-gray-200 line-clamp-1">
                  {references ? references : 'Cuéntanos la historia'}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* PASO 4: Duración, Código de Acceso & Generación */}
        {currentStep === 4 ? (
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0f1224]/80 border border-indigo-500/40 shadow-xl shadow-indigo-950/20 transition-all space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-400">
                PASO 4 · AHORA
              </span>
              <span className="text-xs font-mono font-bold text-teal-300">
                {duration}s ({Math.floor(duration / 60)}m {duration % 60 ? `${duration % 60}s` : ''})
              </span>
            </div>

            {/* Duration selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>Duración de la Canción</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {durationPresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setDuration(preset.value)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
                      duration === preset.value
                        ? 'bg-teal-500/25 border-teal-400 text-teal-200 shadow-md shadow-teal-900/30'
                        : 'bg-gray-900/80 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {codeInfo?.valid && durationPresets.length < 6 && (
                <p className="mt-2 text-[11px] text-gray-500">
                  Tu código permite hasta {codeInfo.maxDurationSec}s — elige un plan mayor para más duración.
                </p>
              )}
            </div>

            {/* Voice gender selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2 mb-2">
                <VenusAndMars className="w-4 h-4 text-pink-400" />
                <span>Voz de la Canción</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 'masculina', label: 'Masculina', icon: Mars },
                  { value: 'femenina', label: 'Femenina', icon: Venus },
                  { value: 'ambas', label: 'Ambas voces', icon: VenusAndMars },
                  { value: 'cualquiera', label: 'Cualquiera', icon: Shuffle }
                ].map((option) => {
                  const OptionIcon = option.icon;
                  const isSelected = voiceGender === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setVoiceGender(option.value)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-pink-500/25 border-pink-400 text-pink-200 shadow-md shadow-pink-900/30'
                          : 'bg-gray-900/80 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                      }`}
                    >
                      <OptionIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                Masculina/Femenina: una sola voz protagonista · Ambas voces: dueto alternando estrofas · Cualquiera: la IA elige la que mejor encaje con el estilo.
              </p>
            </div>

            {/* Access Code Box */}
            <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-400" />
                  <span>Código de Acceso Requerido</span>
                </label>
                {codeInfo?.valid && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                    {codeInfo.remaining === 'unlimited' ? '♾️ Ilimitado' : `${codeInfo.remaining} canciones disponibles`}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  onFocus={(e) => {
                    const target = e.target;
                    setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
                  }}
                  placeholder="Ej: TEST-1SONG-7A9B"
                  className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-xs sm:text-sm text-white font-mono uppercase tracking-wider focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => validateCode(accessCode)}
                  disabled={isValidatingCode}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50 flex-shrink-0"
                >
                  {isValidatingCode ? 'Verificando...' : 'Validar'}
                </button>
              </div>

              {codeError && (
                <p className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{codeError}</span>
                </p>
              )}

              {/* Demo test codes */}
              <div className="mt-2.5 pt-2 border-t border-gray-800/60 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-gray-400 text-[10px]">Prueba con:</span>
                {[
                  { label: 'Solo', code: 'TEST-1SONG-7A9B' },
                  { label: 'Pack 3', code: 'DEMO-PACK3-9F2C' },
                  { label: 'Pack 5', code: 'DEMO-PACK5-7R1L' }
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setAccessCode(c.code);
                      validateCode(c.code);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                      accessCode === c.code
                        ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live generation progress banner */}
            {isGenerating && (
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/60 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-xs text-purple-300">
                  <span className="font-semibold">{loadingSteps[generationStep]}</span>
                  <span className="font-mono">{((generationStep + 1) * 25)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700 rounded-full"
                    style={{ width: `${(generationStep + 1) * 25}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 text-center">
                  La Inteligencia Artificial está componiendo letra e instrumentación de estudio. Esto toma entre 10 y 25 segundos.
                </p>
              </div>
            )}

          </div>
        ) : (
          <div
            onClick={() => setCurrentStep(4)}
            className="p-4 rounded-2xl border bg-gray-900/40 border-gray-800 hover:border-gray-700 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                4
              </div>
              <div className="text-sm font-semibold text-gray-400">
                Duración de la canción y Código de Acceso
              </div>
            </div>
            <Clock className="w-4 h-4 text-gray-500" />
          </div>
        )}

      </div>

      {/* Navigation Footer matching Image 1 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-800/80 gap-2 sm:gap-4">
        {/* Back Button */}
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1 || isGenerating}
          className={`flex-shrink-0 px-4 sm:px-5 py-3 rounded-2xl border text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 sm:gap-2 ${
            currentStep === 1
              ? 'opacity-30 cursor-not-allowed border-gray-800 text-gray-500'
              : 'bg-gray-900/90 border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 hover:bg-gray-800'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Atrás</span>
        </button>

        {/* Next / Submit Button with Glowing Gradient and Shimmer */}
        <button
          type="button"
          onClick={handleNext}
          disabled={isGenerating || (currentStep === 4 && (!codeInfo?.valid || codeInfo?.isExhausted))}
          className="relative min-w-0 flex-1 sm:flex-initial px-4 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-pink-500 hover:from-purple-500 hover:via-pink-500 hover:to-pink-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-pink-900/40 hover:shadow-pink-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shimmer-effect flex items-center justify-center gap-1.5 sm:gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkle className="hidden sm:inline-block w-3.5 h-3.5 text-pink-200 flex-shrink-0" animation="animate-twinkle" />
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
              <span className="truncate">Generando canción...</span>
            </>
          ) : (
            <>
              <span className="truncate">{getNextStepLabel()}</span>
              <ArrowRight className="w-4 h-4 flex-shrink-0" />
            </>
          )}
        </button>
      </div>

    </div>
  );
}
