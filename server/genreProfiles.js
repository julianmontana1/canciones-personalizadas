// Musical "recipes" sent to ElevenLabs. The API responds far better to concrete
// instrumentation, tempo and vocal direction in English than to a bare genre name,
// so each profile spells out what the arrangement should actually contain.

const GENRE_PROFILES = {
  dormir: {
    label: 'gentle lullaby (nana para dormir)',
    aliases: ['cancion de dormir', 'nana', 'arrullo', 'dormir', 'lullaby', 'cuna'],
    instruments: 'delicate music box, soft celesta, warm felt piano, gentle harp arpeggios and a barely-there warm pad, with no drums at all',
    tempo: 'very slow and soothing, around 62 BPM, with a gentle rocking lullaby feel',
    vocals: 'extremely soft, tender maternal female voice, almost whispered, never belting',
    backing: 'soft wordless humming and gentle "la-la-la" harmonies drifting behind the lead',
    production: 'quiet, warm and cocooning, wide soft reverb, very low dynamic range, calming from start to finish',
    avoid: 'drums, brass, loud percussion, distortion, sudden dynamic changes, anything startling or energetic'
  },

  infantil: {
    label: 'energetic children\'s dance-along song, made for jumping and dancing',
    aliases: ['fiesta infantil', 'musica infantil', 'infantil bailable', 'infantil', 'ninos', 'ninas', 'kids', 'children'],
    instruments: 'bouncy glockenspiel and xylophone melodies, strummed ukulele, playful synth plucks, handclaps, whistles and light shakers',
    tempo: 'very energetic, bouncy dance tempo around 128 BPM in a bright major key, built to make kids jump and move',
    vocals: 'cheerful, clear and highly rhythmic lead voice singing short, catchy, easy-to-repeat phrases a child can chant and dance along to',
    backing: "a children's choir enthusiastically echoing and repeating each catchy phrase, call-and-response style, like a viral kids dance song",
    production: 'bright, clean, punchy and highly repetitive/chantable, everything clear and up-front, designed to get kids up and jumping',
    avoid: 'dark or melancholic mood, distortion, aggressive drums, complex harmony, slow tempo, birthday-party references'
  },

  cumpleanosInfantil: {
    label: "children's birthday party song (cumpleaños infantil)",
    aliases: ['cumpleanos infantil', 'cumple infantil', 'fiesta de cumpleanos infantil'],
    instruments: 'bouncy glockenspiel, playful piano, ukulele, party whistles, kazoo, handclaps and light festive percussion',
    tempo: 'happy, bouncy birthday-party tempo around 118 BPM in a bright major key',
    vocals: 'cheerful, warm lead voice full of birthday-party energy, inviting the birthday child to dance and blow out the candles',
    backing: "a children's choir singing and shouting along enthusiastically, birthday-party sing-along atmosphere",
    production: 'bright, clean, playful and festive, balloons-and-cake birthday-party atmosphere',
    avoid: 'dark or melancholic mood, distortion, aggressive drums, complex harmony'
  },

  infantilClasica: {
    label: "classic traditional children's sing-along song",
    aliases: ['infantil clasica', 'clasica infantil', 'cancion infantil clasica', 'vaca lola', 'pin pon'],
    instruments: 'simple acoustic guitar or piano, gentle orchestral strings, soft xylophone and light hand percussion, warm and simple like a classic children\'s television song',
    tempo: 'gentle, moderate sing-along tempo around 100 BPM, simple and easy to follow',
    vocals: 'warm, friendly, clearly-enunciated lead voice with a classic educational children\'s-show quality, simple and repetitive melody',
    backing: "a small children's choir joining in on repeated, easy-to-memorize phrases",
    production: 'warm, simple, nostalgic classic children\'s-program production, clean and gentle',
    avoid: 'aggressive drums, EDM synths, dark mood, complex modern production, distortion'
  },

  infantilModerna: {
    label: 'modern kid-friendly pop song',
    aliases: ['infantil moderna', 'moderna infantil', 'pop infantil'],
    instruments: 'bright modern pop synths, clean plucked guitars, punchy but kid-friendly programmed drums, light claps and a playful bass',
    tempo: 'upbeat modern pop tempo around 110 BPM, current and radio-friendly but clean',
    vocals: 'youthful, bright, clearly-enunciated lead voice with a modern pop feel, fully appropriate and clean for children',
    backing: 'stacked youthful vocal harmonies on the chorus, fun and catchy',
    production: 'glossy modern pop production, but kid-appropriate: no innuendo, no dark themes, clean and colorful',
    avoid: 'explicit or mature themes, heavy distortion, dark mood, overly complex harmony'
  },

  rondas: {
    label: "traditional children's round / playground game song (ronda infantil)",
    aliases: ['rondas infantiles', 'ronda infantil', 'rondas', 'ronda', 'juego de ninos', 'cancion de juego'],
    instruments: 'simple strummed acoustic guitar or ukulele, wooden xylophone, handclaps and finger snaps, a light triangle, with no drum kit at all',
    tempo: 'simple skipping tempo around 100 BPM, easy for a group of children to clap and sing along to',
    vocals: 'bright, playful group of children singing together in unison with a simple singsong melody',
    backing: 'classic call-and-response between one leading child voice and the full group repeating each line, like a schoolyard game',
    production: 'warm, natural, unplugged schoolyard-game feel, minimal and clean, no studio effects',
    avoid: 'electronic instruments, complex harmony, adult themes, dark or intense mood, drum machines'
  },

  banda: {
    label: 'Banda Sinaloense (regional Mexican brass band)',
    aliases: ['banda sinaloense', 'sinaloense', 'banda', 'nortena', 'norteno', 'corrido'],
    instruments: 'full brass banda — tambora bass drum, tarola snare, sousaphone tuba bassline, clarinets carrying the melody, trumpets harmonized in thirds, trombones and charchetas',
    tempo: 'upbeat celebratory tempo around 125 BPM driven by the tuba-and-tambora groove',
    vocals: 'powerful male ranchera voice, open-throated and proud, with occasional festive gritos',
    backing: 'full group shouts and unison male coros answering the lead on every chorus',
    production: 'live-band feel with the brass forward in the mix, wide and punchy',
    avoid: 'synthesizers, drum machines, electric guitars, autotune, ambient pads'
  },

  salsa: {
    label: 'salsa brava (Caribbean big-band salsa)',
    aliases: ['salsa brava', 'salsa', 'caribena'],
    instruments: 'montuno piano, congas, timbales, bongó with campana, güiro and maracas, walking tumbao bass, and a punchy trumpet-and-trombone horn section',
    tempo: 'energetic dance tempo around 190 BPM locked to the clave, tight and syncopated',
    vocals: 'passionate male sonero lead with improvised soneos in the montuno section',
    backing: 'classic call-and-response coro — the chorus group repeats the hook while the lead improvises between phrases',
    production: 'live salsa orchestra sound, crisp percussion, bright horns, wide stereo image',
    avoid: 'electronic drums, synth pads, trap hi-hats, ballad tempo'
  },

  mariachi: {
    label: 'mariachi tradicional (traditional Mexican mariachi)',
    aliases: ['mariachi', 'ranchera'],
    instruments: 'violin section, two trumpets harmonized in thirds, strummed vihuela, guitarrón bass and classical guitar',
    tempo: 'moderate ranchera tempo around 90 BPM with a proud, swaying feel',
    vocals: 'powerful male ranchera voice with rich vibrato, long sustained notes and heartfelt gritos',
    backing: 'warm group male coros joining in harmony on the chorus',
    production: 'traditional acoustic mariachi ensemble captured in a natural room',
    avoid: 'drum kit, synthesizers, electric bass, electronic percussion'
  },

  vallenato: {
    label: 'vallenato tradicional (classic Colombian vallenato)',
    aliases: ['vallenato', 'caja vallenata', 'provinciano', 'parrandero'],
    instruments: 'lead diatonic accordion melody, caja vallenata hand drum and guacharaca scraper driving the rhythm, with a simple acoustic or electric bass and no brass section',
    tempo: 'moderate paseo/vallenato tempo around 85 BPM with a swaying, storytelling groove',
    vocals: 'warm, expressive male voice telling a heartfelt story, classic Colombian vallenato phrasing',
    backing: 'mostly a solo storytelling voice, with occasional soft group vocal answers on key phrases',
    production: 'authentic acoustic vallenato ensemble, warm and intimate, accordion prominent in the mix',
    avoid: 'brass horns, electronic drums, synthesizers, heavy dance production'
  },

  cumbia: {
    label: 'Colombian cumbia (festive tropical cumbia)',
    aliases: ['cumbia', 'tropical', 'fiesta tropical'],
    instruments: 'lead accordion, guacharaca scraper, caja vallenata, alegre and llamador drums, maracas, groovy electric bass and bright brass stabs',
    tempo: 'danceable tropical tempo around 95 BPM with an irresistible two-step cumbia groove',
    vocals: 'warm, cheerful lead voice with a festive Colombian coastal flavor',
    backing: 'lively group coros singing along on the chorus, party atmosphere',
    production: 'bright tropical mix with percussion forward and warm analog character',
    avoid: 'distorted guitars, EDM drops, heavy trap drums, melancholic mood'
  },

  cumpleanos: {
    label: 'festive birthday celebration song (cumpleaños)',
    aliases: ['cumpleanos', 'feliz cumpleanos', 'cumple'],
    instruments: 'lively acoustic and electric guitars, festive percussion, bright horns or synth stabs, handclaps and a singable celebratory melodic hook',
    tempo: 'upbeat celebratory tempo around 120 BPM, danceable and joyful',
    vocals: 'warm, joyful lead voice full of celebration energy, inviting everyone to sing along',
    backing: 'a full group of friends and family singing along on the chorus, party atmosphere with shouted cheers',
    production: 'bright, festive party production, warm and full, radio-ready',
    avoid: 'somber mood, minimalism, slow ballad tempo'
  },

  salsaRosa: {
    label: 'salsa romántica / salsa rosa (romantic pop salsa)',
    aliases: ['salsa rosa', 'salsa romantica', 'salsa lenta'],
    instruments: 'smooth piano montuno, soft congas and timbales, melodic bass, sweetened string pads and a mellow horn section playing gentle countermelodies',
    tempo: 'relaxed romantic salsa tempo around 96 BPM, smoother and less frantic than salsa brava',
    vocals: 'tender, romantic male lead voice, singing sweetly with emotional restraint rather than aggressive improvisation',
    backing: 'soft harmony vocals gently supporting the chorus, romantic and warm',
    production: 'polished romantic salsa-ballad production, warm and sweet, radio-friendly',
    avoid: 'aggressive brass stabs, fast frantic tempo, rough sonero improvisation, harsh mixing'
  },

  balada: {
    label: 'balada romántica (Latin romantic ballad)',
    aliases: ['balada romantica', 'balada', 'romantica'],
    instruments: 'grand piano leading, lush string section swelling into the chorus, nylon-string acoustic guitar, fretless bass and soft brushed drums',
    tempo: 'slow, emotional tempo around 68 BPM that leaves room for the vocal to breathe',
    vocals: 'intimate and emotive lead vocal, tender in the verses and opening up powerfully in the chorus',
    backing: 'soft layered harmony vocals doubling the chorus melody a third and an octave above',
    production: 'polished cinematic ballad production, warm reverb, building dynamically from verse to chorus',
    avoid: 'aggressive percussion, distorted guitars, electronic drops, fast tempo'
  },

  bolero: {
    label: 'bolero clásico (classic Latin bolero)',
    aliases: ['bolero', 'trio romantico', 'requinto'],
    instruments: 'requinto acoustic guitar playing melodic fills, rhythm guitars in a classic bolero clave pattern, soft claves, gentle bongó and maracas, with no drum kit',
    tempo: 'slow, nostalgic bolero tempo around 66 BPM with the classic bolero clave rhythm',
    vocals: 'deeply emotional, romantic tenor lead voice with rich vibrato, nostalgic and heartfelt',
    backing: 'lush trio-style three-part vocal harmony present through most of the song, like a classic bolero trio',
    production: 'warm, intimate, vintage acoustic bolero ensemble sound, nostalgic and elegant',
    avoid: 'drum kit, electric guitars, synthesizers, upbeat dance tempo'
  },

  pop: {
    label: 'modern Latin pop',
    aliases: ['pop latino', 'pop moderno', 'pop'],
    instruments: 'bright plucked synths, layered acoustic and clean electric guitars, punchy programmed drums with claps, deep sub bass and light latin percussion',
    tempo: 'upbeat contemporary tempo around 105 BPM with a radio-friendly groove',
    vocals: 'youthful, polished contemporary lead vocal with rhythmic phrasing',
    backing: 'stacked vocal harmonies and gang-vocal layers lifting the chorus',
    production: 'glossy modern pop mix, wide and loud, radio-ready master',
    avoid: 'heavy distortion, orchestral scoring, lo-fi noise, dated production'
  },

  acustico: {
    label: 'intimate acoustic singer-songwriter',
    aliases: ['acustico', 'acoustic', 'guitarra y voz', 'unplugged'],
    instruments: 'fingerpicked nylon-string acoustic guitar as the foundation, subtle cajón, upright bass and a distant string pad',
    tempo: 'gentle, unhurried tempo around 80 BPM with a natural, human feel',
    vocals: "warm, close-mic'd, slightly breathy lead vocal, sincere and conversational",
    backing: 'gentle double-tracked harmony vocals appearing only on the chorus',
    production: 'organic and minimal, close and intimate, like a live take in a small room',
    avoid: 'drum machines, synthesizers, heavy production, loud mastering'
  },

  reggaeton: {
    label: 'reggaetón / Latin urban',
    aliases: ['reggaeton', 'urbano', 'dembow', 'trap latino', 'trap'],
    instruments: 'classic dembow drum pattern, deep 808 sub bass, snappy claps and snares, marimba-style plucked synth chords and atmospheric pads',
    tempo: 'club tempo around 95 BPM with a hypnotic dembow bounce',
    vocals: 'rhythmic melodic urban lead vocal, confident and modern, with light tuning',
    backing: 'layered ad-libs, doubled hooks and vocal chops answering the lead',
    production: 'punchy modern urban mix, heavy low end, tight and club-ready',
    avoid: 'acoustic folk instruments, orchestral strings, rock guitars, slow ballad tempo'
  },

  reggae: {
    label: 'reggae tropical en español (Latin Caribbean reggae)',
    aliases: ['reggae en espanol', 'reggae', 'ragga'],
    instruments: 'offbeat skank rhythm guitar and organ bubble, a deep and prominent reggae bassline, a classic one-drop drum pattern and light horn section accents',
    tempo: 'laid-back reggae riddim tempo around 80 BPM with a relaxed offbeat groove',
    vocals: 'warm, laid-back lead voice with a relaxed island phrasing, singing in Spanish with a Caribbean/tropical feel',
    backing: 'smooth harmony vocals echoing key phrases, relaxed island backing chorus',
    production: 'warm analog reggae production, deep bass forward in the mix, spacious and echo-laden',
    avoid: 'aggressive drums, EDM synths, fast tempo, distorted guitars'
  },

  rock: {
    label: 'Latin pop rock',
    aliases: ['pop rock', 'rock'],
    instruments: 'driving distorted electric rhythm guitars, melodic lead guitar lines, live drum kit, punchy electric bass and a guitar solo in the bridge',
    tempo: 'energetic tempo around 130 BPM with a strong backbeat',
    vocals: 'energetic rock lead vocal with grit and passion, soaring in the chorus',
    backing: 'anthemic gang backing vocals shouting along on the chorus',
    production: 'big live rock production with wide guitars and powerful roomy drums',
    avoid: 'electronic dance drops, tropical percussion, soft ambient textures'
  },

  lofi: {
    label: 'lo-fi chill hop',
    aliases: ['lo-fi', 'lofi', 'chill hop', 'chillhop', 'chill'],
    instruments: 'dusty vinyl crackle, mellow Rhodes electric piano with jazzy seventh chords, laid-back boom-bap drums, warm upright bass and a soft muted trumpet line',
    tempo: 'relaxed tempo around 78 BPM with a loose, behind-the-beat swing',
    vocals: 'soft, close, relaxed lead vocal, almost spoken, gently filtered',
    backing: 'airy, hazy harmony vocals floating behind the lead',
    production: 'warm tape saturation, low-pass filtered, nostalgic and cozy, never bright or harsh',
    avoid: 'loud aggressive drums, EDM synths, distortion, high energy'
  },

  electronica: {
    label: 'Latin EDM / electronic dance',
    aliases: ['electronica', 'edm', 'electronic', 'house', 'techno', 'dance'],
    instruments: 'supersaw synth leads, arpeggiated sequences, sidechained pads, four-on-the-floor kick, punchy claps, risers and a euphoric drop',
    tempo: 'high-energy tempo around 126 BPM built around tension and release',
    vocals: 'bright anthemic lead vocal, processed and wide, soaring over the drop',
    backing: 'huge stacked vocal layers and chopped vocal hooks in the drop',
    production: 'festival-ready electronic production, massive stereo width, punchy and loud',
    avoid: 'acoustic folk instruments, live orchestra, lo-fi textures, slow tempo'
  },

  bachata: {
    label: 'bachata dominicana',
    aliases: ['bachata'],
    instruments: 'lead requinto guitar with signature bachata guitar runs, güira, bongó and a simple melodic bass',
    tempo: 'romantic bachata tempo around 130 BPM with the classic bachata guitar syncopation',
    vocals: 'passionate, romantic male lead voice',
    backing: 'soft harmony vocals joining on the chorus',
    production: 'warm, romantic Dominican bachata production',
    avoid: 'brass sections, electronic drums, EDM synths'
  },

  carranga: {
    label: 'carranga colombiana (Andean campesino party music)',
    aliases: ['carranga', 'carranguera', 'carranguero', 'musica campesina'],
    instruments: 'strummed tiple and requinto guitars carrying the melody, a guacharaca scraper driving the rhythm, and an upright acoustic bass, with no brass or electronic instruments',
    tempo: 'lively campesino tempo around 130 BPM with a bouncy, danceable feel',
    vocals: 'cheerful, down-to-earth male voice with a warm rural Colombian Andean accent, witty and storytelling',
    backing: 'group male voices joining in on the chorus, festive countryside party atmosphere',
    production: 'raw, warm acoustic string-band production, rustic and full of character',
    avoid: 'electronic drums, synthesizers, urban or EDM production, brass horns'
  },

  rap: {
    label: 'rap / hip-hop',
    aliases: ['rap', 'hip hop', 'hiphop', 'freestyle'],
    instruments: 'punchy boom-bap drum breaks, a deep sampled bassline, scratched vinyl textures and a simple looped piano or soul sample',
    tempo: 'classic hip-hop tempo around 90 BPM with a laid-back head-nodding groove',
    vocals: 'confident, rhythmic RAPPED vocal delivery with clear diction and clever rhyme flow — spoken-flow rap, not sung melody',
    backing: 'occasional shouted hype-man ad-libs and a simple chanted hook',
    production: 'raw boom-bap hip-hop production with warm vinyl crackle and punchy low end',
    avoid: 'sung melodic ballad vocals, orchestral strings, EDM drops'
  }
};

// Lightweight recipes for common genres customers type into the free-text "custom style"
// field that are NOT one of our curated picker options (e.g. "un tango triste",
// "algo estilo jazz"). These don't need the full picker treatment, just enough
// detail that the model doesn't default to generic pop.
const KEYWORD_HINTS = {
  merengue: {
    label: 'merengue dominicano',
    aliases: ['merengue'],
    instruments: 'fast tambora drum, g\u00fcira metal scraper and rapid two-note accordion or synth-brass riffs',
    tempo: 'very fast merengue tempo around 140 BPM',
    vocals: 'energetic, festive male lead voice',
    backing: 'group coros shouting the hook along with the lead',
    production: 'bright, festive dance-hall merengue mix',
    avoid: 'slow tempo, somber or melancholic mood'
  },
  tango: {
    label: 'tango argentino',
    aliases: ['tango'],
    instruments: 'bandone\u00f3n lead melody, dramatic strings, piano and upright bass in a classic tango rhythm',
    tempo: 'dramatic tango tempo around 66 BPM with sharp rhythmic accents',
    vocals: 'deep, dramatic and passionate lead voice',
    backing: 'minimal \u2014 mostly a solo voice answered by instrumental phrases',
    production: 'cinematic, dramatic Argentine tango orchestration',
    avoid: 'electronic elements, upbeat pop production, drum kit'
  },
  jazz: {
    label: 'jazz vocal',
    aliases: ['jazz'],
    instruments: 'smooth jazz piano chords, a walking upright bass line, brushed drums and a soft muted trumpet or saxophone',
    tempo: 'relaxed swing feel around 100 BPM',
    vocals: 'smooth, sultry jazz vocal phrasing with subtle swing',
    backing: 'soft scatted harmony vocals',
    production: 'warm, intimate jazz-club production',
    avoid: 'electronic drums, distortion, EDM synths'
  },
  gospel: {
    label: 'gospel / m\u00fasica cristiana',
    aliases: ['gospel', 'cristiana', 'cristiano', 'religiosa'],
    instruments: 'uplifting organ, gospel piano chords, clapping percussion and a full choir',
    tempo: 'building tempo around 90 BPM with dynamic swells',
    vocals: 'powerful, soulful lead voice full of emotion',
    backing: 'a full gospel choir singing rich harmonies in call-and-response with the lead',
    production: 'big, uplifting, spiritual gospel production',
    avoid: 'cold electronic production, minimalism, dark mood'
  },
  kpop: {
    label: 'K-pop',
    aliases: ['k-pop', 'kpop'],
    instruments: 'glossy layered synths, punchy trap-influenced drums, bright plucked leads and a big synth-bass drop in the chorus',
    tempo: 'high-energy tempo around 128 BPM with dynamic section changes',
    vocals: 'bright, polished, agile lead vocal with rap-sung verse trade-offs',
    backing: 'tight, punchy stacked group vocal harmonies',
    production: 'ultra-polished, wide, maximalist modern pop production',
    avoid: 'raw lo-fi textures, acoustic folk instruments, slow ballad tempo'
  }
};

const FALLBACK_PROFILE = {
  label: 'contemporary Latin song',
  instruments: 'a tasteful arrangement with acoustic guitar, piano, warm bass, natural drums and light latin percussion',
  tempo: 'moderate tempo around 100 BPM with a steady, inviting groove',
  vocals: 'expressive, emotional lead vocal with clear diction',
  backing: 'layered harmony vocals supporting the chorus',
  production: 'clean modern studio mix, balanced stereo image, radio-ready master',
  avoid: 'muddy low end, off-key vocals, abrupt endings'
};

// Era / mood modifiers a customer might add on top of a genre ("del viejo", "de los 90",
// "retro"). Detected separately from the genre itself so "vallenato del viejo" still
// resolves to the vallenato profile AND picks up a nostalgic production note.
const MODIFIER_HINTS = [
  { match: ['90s', '90\'s', 'noventa', 'de los 90'], text: 'Channel the authentic sound and analog studio warmth of 1990s production.' },
  { match: ['80s', '80\'s', 'ochenta', 'de los 80'], text: 'Channel the authentic synth-driven sound of 1980s production.' },
  { match: ['70s', '70\'s', 'setenta', 'de los 70'], text: 'Channel the authentic warm analog sound of 1970s production.' },
  { match: ['viejo', 'antiguo', 'clasico', 'de antes', 'old school', 'vintage', 'retro'], text: 'Give it a nostalgic, old-school, vintage character with warm analog texture, as if recorded decades ago.' },
  { match: ['moderno', 'actual', 'nuevo estilo'], text: 'Keep the production sounding current and modern.' },
  { match: ['lento', 'suave y lento'], text: 'Take the tempo slower and gentler than usual for this genre.' },
  { match: ['rapido', 'movido', 'bien alegre'], text: 'Take the tempo faster and more energetic than usual for this genre.' }
];

const normalize = (value) =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const findLongestAliasMatch = (normalized, entries) => {
  let best = null;
  let bestLength = 0;
  for (const entry of entries) {
    for (const alias of entry.aliases) {
      if (alias.length > bestLength && normalized.includes(alias)) {
        best = entry;
        bestLength = alias.length;
      }
    }
  }
  return best;
};

// Tries our curated picker genres first, then the lighter keyword hints for common
// genres customers type but that aren't in the picker, then a genre-agnostic fallback
// that leans on the underlying model's own knowledge of the literal genre name typed.
export const resolveGenreProfile = (style) => {
  const normalized = normalize(style);

  const known = findLongestAliasMatch(normalized, Object.values(GENRE_PROFILES));
  if (known) return known;

  const hinted = findLongestAliasMatch(normalized, Object.values(KEYWORD_HINTS));
  if (hinted) return hinted;

  if (!style || !style.trim()) return FALLBACK_PROFILE;

  // Truly unrecognized text: instead of imposing our own generic instrumentation
  // (which would drown out whatever the customer actually typed), explicitly ask
  // the model to interpret the genre name itself authentically.
  return {
    label: `${style.trim()} style song`,
    instruments: `instrumentation that is authentic and idiomatic to the genre "${style.trim()}" \u2014 choose real instruments genuinely associated with that specific style`,
    tempo: `a tempo and rhythmic feel that is authentic and idiomatic to "${style.trim()}"`,
    vocals: `a vocal style and delivery that is authentic and idiomatic to "${style.trim()}"`,
    backing: 'backing vocals or coros appropriate to that genre if the genre traditionally uses them',
    production: `production, mixing and mastering choices genuinely characteristic of "${style.trim()}"`,
    avoid: 'instrumentation or production choices that would clash with or misrepresent this specific genre'
  };
};

const detectModifiers = (style) => {
  const normalized = normalize(style);
  const matched = MODIFIER_HINTS.filter((mod) => mod.match.some((kw) => normalized.includes(kw)));
  return matched.map((mod) => mod.text);
};

const structureFor = (durationSec) => {
  if (durationSec <= 45) return 'a short intro, one single memorable chorus, and a clean resolved ending';
  if (durationSec <= 90) return 'a short intro, one verse, a full chorus, and a clean resolved ending';
  if (durationSec <= 150) return 'intro, verse 1, chorus, verse 2, final chorus, resolved outro';
  return 'intro, verse 1, pre-chorus, chorus, verse 2, chorus, instrumental bridge, final chorus with added vocal harmonies, resolved outro';
};

// Overrides the genre profile's default vocal gender when the customer picked one
// explicitly. Appended as an explicit directive rather than rewriting profile.vocals
// text (which is often gendered inline, e.g. "maternal female voice") so it reliably
// takes precedence regardless of how each profile happens to be worded.
const VOICE_GENDER_OVERRIDES = {
  masculina: 'Regardless of any other vocal description, the lead vocal must be sung by a male voice.',
  femenina: 'Regardless of any other vocal description, the lead vocal must be sung by a female voice.',
  ambas: 'This song must feature both a male and a female voice, for example alternating verses or singing together as a duet.'
};

export const buildMusicPrompt = ({ style, names, references, durationSec, voiceGender }) => {
  const profile = resolveGenreProfile(style);
  const modifiers = detectModifiers(style);
  const dedication = (names || '').trim() || 'someone special';
  const story = (references || '').trim();
  const voiceOverride = VOICE_GENDER_OVERRIDES[voiceGender] || '';

  return [
    `A high-quality, professionally produced ${profile.label}, ${durationSec} seconds long.`,
    `Instrumentation: ${profile.instruments}.`,
    `Tempo and feel: ${profile.tempo}.`,
    `Lead vocal: ${profile.vocals}.`,
    `Backing vocals: ${profile.backing}.`,
    `Structure: ${structureFor(durationSec)}.`,
    ...modifiers,
    voiceOverride,
    `The lyrics must be performed entirely in natural Latin American Spanish with a neutral Colombian accent, never in English.`,
    `This is a personalized gift song. The dedication, written by the customer, is: "${dedication}".`,
    story ? `Weave these personal details naturally into the verses: ${story}.` : '',
    `The chorus must be catchy and repeated, and must name the person the song is dedicated to so it is unmistakably personal.`,
    `Production: ${profile.production}.`,
    `Avoid: ${profile.avoid}.`
  ]
    .filter(Boolean)
    .join(' ');
};
