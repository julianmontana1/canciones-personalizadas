// Realistic Audio Player for 10-second studio genre previews
// Uses real MP3 instrument recordings with 10-second playback and smooth fade-out

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

export const playGenrePreview = (genreId, onEnd) => {
  stopAllAudioPreviews();

  // Mapping to real studio recordings in /audio/samples/
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

  const audioPath = sampleMap[genreId] || sampleMap.pop;
  const audio = new Audio(audioPath);
  activeAudio = audio;

  audio.volume = 0.85;

  // Jump into the sweet spot / hook for certain genres
  audio.addEventListener('loadedmetadata', () => {
    if (genreId === 'cumbia') audio.currentTime = 4;
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

  // Start smooth volume fade out at 8.0s
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
};
