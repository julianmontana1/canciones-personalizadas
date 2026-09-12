// Realistic Audio Player for studio genre previews.
// A real generated demo (see /api/genre-demos) plays in full, with a smooth
// fade over its last few seconds; the generic instrument-only fallback samples
// stay a short 10-second teaser like before.

let activeAudio = null;
let activeStopTimer = null;
let activeFadeInterval = null;

export const stopAllAudioPreviews = () => {
  if (activeStopTimer) {
    clearTimeout(activeStopTimer);
    activeStopTimer = null;
  }
  if (activeFadeInterval) {
    clearInterval(activeFadeInterval);
    activeFadeInterval = null;
  }
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch (e) {}
    activeAudio = null;
  }
};

// `realAudioUrl` (a real AI-generated demo for that genre, when one exists —
// see /api/genre-demos) takes priority over the generic instrument-only sample
// below, and plays in full rather than being cut off at 10 seconds.
export const playGenrePreview = (genreId, onEnd, realAudioUrl) => {
  stopAllAudioPreviews();

  // Mapping to real studio recordings in /audio/samples/ (fallback for genres
  // that don't have a real generated demo yet)
  const sampleMap = {
    pop: '/audio/samples/pop.mp3',
    balada: '/audio/samples/balada.mp3',
    reggaeton: '/audio/samples/reggaeton.mp3',
    rock: '/audio/samples/rock.mp3',
    cumbia: '/audio/samples/cumbia.mp3',
    acustico: '/audio/samples/acustico.mp3',
    lofi: '/audio/samples/lofi.mp3',
    electronica: '/audio/samples/electronica.mp3',
    salsa: '/audio/samples/salsa.mp3',
    mariachi: '/audio/samples/mariachi.mp3',
    banda: '/audio/samples/banda.mp3',
    infantil: '/audio/samples/infantil.mp3',
    dormir: '/audio/samples/dormir.mp3',
  };

  const audioPath = realAudioUrl || sampleMap[genreId] || sampleMap.pop;
  const audio = new Audio(audioPath);
  activeAudio = audio;

  audio.volume = 0.85;

  // Jump into the sweet spot / hook for certain genres
  audio.addEventListener('loadedmetadata', () => {
    if (realAudioUrl) audio.currentTime = 0; // a real generated song's intro IS the hook
    else if (genreId === 'cumbia') audio.currentTime = 4;
    else if (genreId === 'salsa') audio.currentTime = 3;
    else if (genreId === 'banda') audio.currentTime = 2;
    else if (genreId === 'infantil') audio.currentTime = 0;
    else if (genreId === 'dormir') audio.currentTime = 0;
    else if (genreId === 'mariachi') audio.currentTime = 0;
    else audio.currentTime = 2;
  });

  audio.play().catch((e) => {
    console.warn("Audio play prevented:", e);
    if (onEnd) onEnd();
  });

  if (realAudioUrl) {
    // Play the full generated demo to its natural end, with a gentle fade over
    // roughly the last 3 seconds instead of the instrument sample's abrupt cutoff.
    const FADE_WINDOW_SEC = 3;
    audio.addEventListener('timeupdate', () => {
      if (!audio.duration || !isFinite(audio.duration)) return;
      const remaining = audio.duration - audio.currentTime;
      if (remaining <= FADE_WINDOW_SEC) {
        audio.volume = Math.max(0, (remaining / FADE_WINDOW_SEC) * 0.85);
      }
    });
    audio.addEventListener('ended', () => {
      if (onEnd) onEnd();
    });
  } else {
    // Generic instrument sample: stays a short 10-second teaser with fade at 8s.
    activeStopTimer = setTimeout(() => {
      let vol = audio.volume;
      activeFadeInterval = setInterval(() => {
        vol = Math.max(0, vol - 0.08);
        if (audio) audio.volume = vol;
        if (vol <= 0.02) {
          clearInterval(activeFadeInterval);
          activeFadeInterval = null;
          stopAllAudioPreviews();
          if (onEnd) onEnd();
        }
      }, 100);
    }, 8000);
  }
};
