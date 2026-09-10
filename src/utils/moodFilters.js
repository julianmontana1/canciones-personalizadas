// Mood/occasion filter pills used to narrow down the genre picker (SongWizard) and
// the "Explora Estilos" carousel — grouped by why the customer is making the song,
// not by musical family.
export const MOOD_FILTERS = [
  { value: 'all', label: 'Todos', icon: '✨' },
  { value: 'amor', label: 'Amor y Amistad', icon: '💕' },
  { value: 'celebracion', label: 'Celebración', icon: '🎉' },
  { value: 'infantil', label: 'Infantil', icon: '👶' }
];

export const filterByMood = (presets, mood) =>
  mood === 'all' ? presets : presets.filter((preset) => preset.mood === mood);
