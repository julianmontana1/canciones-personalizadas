// Blocks clearly offensive/vulgar customer-submitted text (names, story, custom style)
// before we spend any generation credits. Deliberately conservative: only unambiguous
// vulgarity/insults are listed — common Latino colloquialisms that are usually harmless
// or affectionate in everyday speech (e.g. "chimba", "huevón") are intentionally excluded
// to avoid rejecting innocent submissions.

const normalize = (value) =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

// Each entry is matched as a whole word (accent-insensitive) against the normalized text.
const BLOCKED_WORDS = [
  // Spanish - vulgar / sexual
  'puta', 'putas', 'puto', 'putos', 'putica', 'putico', 'puticas',
  'hijueputa', 'hijoeputa', 'hijodeputa', 'hpta', 'hpt',
  'malparido', 'malparida', 'malparidos', 'malparidas',
  'gonorrea', 'gonorreas',
  'maricon', 'maricones', 'mariconcito',
  'perra', 'perras', 'zorra', 'zorras',
  'verga', 'vergas', 'pinga', 'pingas',
  'cono', 'conos', 'chucha',
  'mierda', 'mierdas',
  'culiao', 'culiado', 'culero', 'culeros',
  'cabron', 'cabrona', 'cabrones',
  'gilipollas',
  'mamahuevo', 'mamaguevo', 'mamawebo',
  'singao', 'singado',

  // English - vulgar / slurs
  'fuck', 'fucking', 'fucker', 'motherfucker',
  'shit', 'bullshit',
  'bitch', 'bitches',
  'asshole', 'assholes',
  'cunt', 'whore', 'slut',
  'bastard',
  'nigger', 'nigga',
  'faggot'
];

const BLOCKED_REGEXES = BLOCKED_WORDS.map((word) => new RegExp(`\\b${word}\\b`, 'i'));

// Returns true if any of the given text fields contain blocked language.
export const containsOffensiveLanguage = (...texts) => {
  const combined = normalize(texts.filter(Boolean).join(' '));
  if (!combined) return false;
  return BLOCKED_REGEXES.some((re) => re.test(combined));
};
