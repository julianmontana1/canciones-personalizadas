// Builds a friendly, descriptive download filename for a song, e.g.
// "julian-salsa-90-seg-sep10.mp3", instead of the internal storage id
// (song.filename, like "song_1babc479dda7.mp3") which means nothing to the customer.

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const slugify = (value) =>
  (value || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();

// Real dedications are rarely just a bare name — customers write phrases like
// "Para mi novia Camila", "Para mi papá Don Roberto en sus 60 años" or "Con amor
// para Martina". A plain first-word split would grab "mi" or "Don" instead of the
// actual name, so we strip the common dedication/relational/title filler first.
const DEDICATION_PREFIX_RE = /^(con amor para|de parte de|dedicada a|canci[oó]n para|nana para|para)\s+/i;
const RELATIONAL_FILLER_RE = /^(mi|mis|nuestro|nuestra|el|la|los|las)\s+(pap[aá]|mam[aá]|novia|novio|esposa|esposo|hijo|hija|hermano|hermana|abuelo|abuela|amigo|amiga|t[ií]o|t[ií]a)\s+/i;
const TITLE_RE = /^(don|do[nñ]a|sr\.?|sra\.?|se[nñ]or|se[nñ]ora)\s+/i;

const extractFirstName = (names) => {
  let text = (names || '').trim();
  text = text.replace(DEDICATION_PREFIX_RE, '').trim();
  text = text.replace(RELATIONAL_FILLER_RE, '').trim();
  text = text.replace(TITLE_RE, '').trim();
  const firstWord = text.split(/\s+/)[0] || '';
  return slugify(firstWord) || 'cancion';
};

// A few style names lead with a generic word before the real genre, e.g.
// "Canción de Dormir / Nana" — there the meaningful identifier is "Nana", in the
// second half after the slash, not the generic "Canción" that comes first.
const GENERIC_GENRE_WORDS = new Set(['cancion', 'musica']);

const extractGenreSlug = (style) => {
  const chunks = (style || '').split(/[/(]/).map((c) => c.trim()).filter(Boolean);
  const firstWord = (chunks[0] || '').split(/\s+/)[0] || '';
  let slug = slugify(firstWord);

  if (GENERIC_GENRE_WORDS.has(slug) && chunks[1]) {
    const secondWord = chunks[1].split(/\s+/)[0] || '';
    slug = slugify(secondWord) || slug;
  }

  return slug || 'personalizada';
};

const formatDateSlug = (timestamp) => {
  const date = timestamp ? new Date(timestamp) : new Date();
  const month = MONTHS_ES[date.getMonth()] || 'ene';
  return `${month}${date.getDate()}`;
};

const buildBaseFilename = (song) => {
  const name = extractFirstName(song?.names);
  const genre = extractGenreSlug(song?.style);
  const duration = parseInt(song?.duration, 10) || 0;
  const dateSlug = formatDateSlug(song?.timestamp);
  return `${name}-${genre}-${duration}-seg-${dateSlug}`;
};

export const buildSongFilename = (song) => `${buildBaseFilename(song)}.mp3`;

// Same naming as the MP3 (e.g. "julian-salsa-90-seg-sep10.mp4") so a customer's
// audio and video downloads are recognizable as belonging to the same song.
export const buildVideoFilename = (song) => `${buildBaseFilename(song)}.mp4`;
