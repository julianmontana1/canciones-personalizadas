// Musical "recipes" sent to ElevenLabs. The API responds far better to concrete
// instrumentation, tempo and vocal direction in English than to a bare genre name,
// so each profile spells out what the arrangement should actually contain — down to
// playing techniques, the exact make-up of the choir, and the background ambience
// that makes a track feel like a real recording instead of a generic AI render.

const GENRE_PROFILES = {
  dormir: {
    label: 'gentle lullaby (nana para dormir)',
    aliases: ['cancion de dormir', 'nana', 'arrullo', 'dormir', 'lullaby', 'cuna'],
    narrative: 'nana',
    instruments: 'a delicate wind-up music box carrying the main melody, a soft celesta doubling it one octave above, a warm felt-hammer piano playing simple root-position chords, gentle nylon harp arpeggios rolling underneath, and one sustained warm analog pad — absolutely no drums or percussion of any kind',
    tempo: 'very slow and soothing, around 62 BPM, in a gentle 6/8 rocking lullaby feel',
    vocals: 'an extremely soft, tender maternal female voice sung barely above a whisper, very close to the microphone, with audible gentle breath between phrases, never belting',
    backing: 'a single soft wordless humming line plus airy "la-la-la" harmonies a third above, mixed far back and blurred into the reverb',
    ambience: 'the faint mechanical wind-down of the music box between phrases, soft rain against a window far away, and a very low warm room tone — nothing sharp, sudden or startling',
    production: 'quiet, warm and cocooning, wide soft reverb, gentle natural dynamics with soft transients and no loudness-maximizing limiting, calming from start to finish',
    avoid: 'drums, brass, loud percussion, distortion, sudden dynamic changes, anything startling or energetic'
  },

  infantil: {
    label: 'energetic children\'s dance-along song, made for jumping and dancing',
    aliases: ['fiesta infantil', 'musica infantil', 'infantil bailable', 'infantil', 'ninos', 'ninas', 'kids', 'children'],
    narrative: 'infantil',
    instruments: 'bouncy glockenspiel and marimba playing the hook in unison, a bright ukulele strumming on every offbeat, playful synth plucks, tight handclaps on beats 2 and 4, a rising slide whistle right before each chorus, cowbell accents, and a simple punchy kick-and-clap groove',
    tempo: 'very energetic, bouncy dance tempo around 128 BPM in a bright major key, built to make kids jump and move',
    vocals: 'a cheerful, clear and highly rhythmic lead voice singing short, catchy, easy-to-repeat phrases a child can chant and dance along to',
    backing: 'a choir of about eight children echoing every catchy phrase straight back in unison, call-and-response style, slightly imperfect and bursting with energy',
    ambience: 'a group of children laughing and shouting "¡eh!" between phrases, party whistles, and the thump of small feet jumping on the floor',
    production: 'bright, clean, punchy and highly repetitive/chantable, everything clear and up-front, designed to get kids up and jumping',
    avoid: 'dark or melancholic mood, distortion, aggressive drums, complex harmony, slow tempo, birthday-party references'
  },

  cumpleanosInfantil: {
    label: "children's birthday party song (cumpleaños infantil)",
    aliases: ['cumpleanos infantil', 'cumple infantil', 'fiesta de cumpleanos infantil'],
    narrative: 'cumpleanosInfantil',
    instruments: 'bouncy glockenspiel, a playful honky-tonk-flavoured upright piano, strummed ukulele, party whistles and kazoo, handclaps, tambourine, and a bright celebratory hook played on tubular bells',
    tempo: 'happy, bouncy birthday-party tempo around 118 BPM in a bright major key',
    vocals: 'a cheerful, warm lead voice full of birthday-party energy, inviting the birthday child to dance and blow out the candles',
    backing: "a children's choir shouting the birthday child's name in unison and singing along enthusiastically on every chorus",
    ambience: 'children cheering and clapping, party horns, one balloon popping, and the clatter of plates and cutlery from a small party in the background',
    production: 'bright, clean, playful and festive, balloons-and-cake birthday-party atmosphere',
    avoid: 'dark or melancholic mood, distortion, aggressive drums, complex harmony'
  },

  infantilClasica: {
    label: "classic traditional children's sing-along song",
    aliases: ['infantil clasica', 'clasica infantil', 'cancion infantil clasica', 'vaca lola', 'pin pon'],
    narrative: 'infantil',
    instruments: 'a simple nylon acoustic guitar strumming basic open chords, a gentle upright piano, a soft xylophone doubling the melody note for note, a light triangle and woodblock keeping very simple time, and a warm accordion holding pads underneath — like a 1980s children\'s television program',
    tempo: 'gentle, moderate sing-along tempo around 100 BPM, simple and easy for a small child to follow',
    vocals: 'a warm, friendly, clearly-enunciated lead voice with a classic educational children\'s-show quality, singing a simple and very repetitive melody',
    backing: "a small choir of about six children singing the repeated phrases in plain unison with no harmony, very natural and charmingly a little out of tune",
    ambience: 'the warm analog hiss of an old tape recording and a faint classroom or living-room room tone',
    production: 'warm, simple, nostalgic classic children\'s-program production, clean and gentle',
    avoid: 'aggressive drums, EDM synths, dark mood, complex modern production, distortion'
  },

  infantilModerna: {
    label: 'modern kid-friendly pop song',
    aliases: ['infantil moderna', 'moderna infantil', 'pop infantil'],
    narrative: 'infantil',
    instruments: 'bright modern pop synth plucks carrying the hook, clean electric guitar with a light chorus effect, punchy but soft programmed drums, finger snaps and claps, a playful rounded sub bass, and a catchy synth lead in the chorus',
    tempo: 'upbeat modern pop tempo around 110 BPM, current and radio-friendly but clean',
    vocals: 'a youthful, bright, clearly-enunciated lead voice with a modern pop feel, fully appropriate and clean for children',
    backing: 'stacked youthful voices doubled in octaves on the chorus hook, plus short punchy "hey!" shouts between phrases',
    ambience: 'subtle riser sweeps building into each chorus and a small crowd "wooo" on the drop into the hook',
    production: 'glossy modern pop production, but kid-appropriate: no innuendo, no dark themes, clean and colorful',
    avoid: 'explicit or mature themes, heavy distortion, dark mood, overly complex harmony'
  },

  rondas: {
    label: "traditional children's round / playground game song (ronda infantil)",
    aliases: ['rondas infantiles', 'ronda infantil', 'rondas', 'ronda', 'juego de ninos', 'cancion de juego'],
    narrative: 'infantil',
    instruments: 'a single strummed nylon guitar or ukulele playing only two or three simple chords, a wooden xylophone doubling the melody, handclaps and finger snaps keeping the pulse, and a small triangle — no drum kit, no bass, nothing electronic',
    tempo: 'simple skipping tempo around 100 BPM, easy for a circle of children to clap and sing along to',
    vocals: 'a bright, playful group of children singing together in unison with a simple singsong melody',
    backing: 'one child voice leading each line and a full circle of children repeating it straight back in unison, exactly like a playground game',
    ambience: 'a schoolyard at recess: distant children playing, open outdoor air, and footsteps circling on concrete',
    production: 'warm, natural, unplugged schoolyard-game feel, minimal and clean, no studio effects',
    avoid: 'electronic instruments, complex harmony, adult themes, dark or intense mood, drum machines'
  },

  banda: {
    label: 'Banda Sinaloense (regional Mexican brass band)',
    aliases: ['banda sinaloense', 'sinaloense', 'banda', 'nortena', 'norteno', 'corrido'],
    narrative: 'fiesta',
    instruments: 'a full Sinaloense brass banda: tambora bass drum struck with the mallet on the downbeat, tarola snare rolling into every phrase, sousaphone tuba walking the bassline in octaves, two clarinets carrying the melody in harmony, three trumpets harmonized in thirds, trombones answering them, and charchetas (alto horns) filling the middle register',
    tempo: 'upbeat celebratory tempo around 125 BPM driven by the tuba-and-tambora groove',
    vocals: 'a powerful male ranchera voice, open-throated and proud, with occasional festive gritos',
    backing: 'a full group of male voices shouting the chorus back in unison, with an occasional "¡ay ay ay!" grito thrown over the top',
    ambience: 'a live plaza party: bottles clinking, whistles and festive gritos from the crowd between phrases',
    production: 'live-band feel with the brass forward in the mix, wide and punchy',
    avoid: 'synthesizers, drum machines, electric guitars, autotune, ambient pads'
  },

  salsa: {
    label: 'salsa brava (Caribbean big-band salsa)',
    aliases: ['salsa brava', 'salsa', 'caribena'],
    narrative: 'fiesta',
    instruments: 'piano driving a montuno in octaves, congas locked into a tumbao, timbales firing an abanico fill to announce every chorus, bongó switching to the campana bell in the montuno section, güiro and maracas riding on top, an upright-feel bass playing a syncopated tumbao, and a tight horn section of two trumpets and a trombone alternating sharp stabs with long moñas',
    tempo: 'energetic dance tempo around 190 BPM locked to the clave, tight and syncopated',
    vocals: 'a passionate male sonero lead improvising soneos over the montuno section',
    backing: 'a classic three-voice coro singing the hook in close thirds, trading call-and-response with the sonero who improvises between every repetition',
    ambience: 'a packed dance hall: crowd cheers, a sharp celebratory shout, glasses and clave sticks alive in the room',
    production: 'live salsa orchestra sound, crisp percussion, bright horns, wide stereo image',
    avoid: 'electronic drums, synth pads, trap hi-hats, ballad tempo'
  },

  cumpleanos: {
    label: 'festive birthday celebration song (cumpleaños)',
    aliases: ['cumpleanos', 'feliz cumpleanos', 'cumple'],
    narrative: 'fiesta',
    instruments: 'bright strummed acoustic guitar, clean electric guitar accents, festive congas and tambourine, a punchy horn section stabbing on every chorus, handclaps on all four beats, and a big singable melodic hook',
    tempo: 'upbeat celebratory tempo around 120 BPM, danceable and joyful',
    vocals: 'a warm, joyful lead voice full of celebration energy, inviting everyone in the room to sing along',
    backing: 'a big group of untrained friends-and-family voices singing the chorus together, joyful and a little rough around the edges',
    ambience: 'a room full of friends and family cheering, glasses toasting, a party horn, and applause at the very end',
    production: 'bright, festive party production, warm and full, radio-ready',
    avoid: 'somber mood, minimalism, slow ballad tempo'
  },

  salsaRosa: {
    label: 'salsa romántica / salsa rosa (romantic pop salsa)',
    aliases: ['salsa rosa', 'salsa romantica', 'salsa lenta'],
    narrative: 'amor',
    instruments: 'a smooth piano montuno played softly in the mid register, congas and timbales kept brushed and restrained, a melodic bass tumbao, sweetened string pads underneath, and a mellow horn section playing legato countermelodies instead of stabs',
    tempo: 'relaxed romantic salsa tempo around 96 BPM, smoother and less frantic than salsa brava',
    vocals: 'a tender, romantic male lead voice singing sweetly with emotional restraint rather than aggressive improvisation',
    backing: 'two soft harmony voices supporting the chorus in thirds, warm and close, never shouted',
    ambience: 'an intimate club just before closing, very light natural room reverb, no crowd noise at all',
    production: 'polished romantic salsa-ballad production, warm and sweet, radio-friendly',
    avoid: 'aggressive brass stabs, fast frantic tempo, rough sonero improvisation, harsh mixing'
  },

  mariachi: {
    label: 'mariachi tradicional (traditional Mexican mariachi)',
    aliases: ['mariachi', 'ranchera'],
    narrative: 'amor',
    instruments: 'a violin section of six playing in unison and in thirds, two trumpets harmonized in thirds with a proud wide vibrato, a vihuela strumming the mánico rhythm, a guitarrón walking the bass in octaves, and a classical guitar filling out the harmony',
    tempo: 'moderate ranchera tempo around 90 BPM with a proud, swaying feel',
    vocals: 'a powerful male ranchera voice with rich vibrato, long sustained notes and heartfelt gritos',
    backing: 'a warm group of male voices joining in harmony on the chorus, with a heartfelt "¡ay!" grito right before the final verse',
    ambience: 'an outdoor serenade at night: crickets, a quiet distant street, and a natural open-air acoustic',
    production: 'traditional acoustic mariachi ensemble captured in a natural room',
    avoid: 'drum kit, synthesizers, electric bass, electronic percussion'
  },

  vallenato: {
    label: 'vallenato tradicional (classic Colombian vallenato)',
    aliases: ['vallenato', 'caja vallenata', 'provinciano', 'parrandero'],
    narrative: 'amor',
    instruments: 'a lead diatonic accordion carrying the melody with quick bellows shakes and ornamental runs between vocal lines, a caja vallenata hand drum driving the paseo rhythm, a guacharaca scraper on every offbeat, and a simple electric bass following the root — no brass and no drum kit',
    tempo: 'moderate paseo/vallenato tempo around 85 BPM with a swaying, storytelling groove',
    vocals: 'a warm, expressive male voice telling a heartfelt story with classic Colombian vallenato phrasing',
    backing: 'mostly a solo storytelling voice, with two male voices joining only on the final line of each chorus',
    ambience: 'a warm Colombian courtyard at dusk: cicadas, distant voices, and a light breeze',
    production: 'authentic acoustic vallenato ensemble, warm and intimate, accordion prominent in the mix',
    avoid: 'brass horns, electronic drums, synthesizers, heavy dance production'
  },

  carranga: {
    label: 'carranga colombiana (Andean campesino party music)',
    aliases: ['carranga', 'carranguera', 'carranguero', 'musica campesina'],
    narrative: 'fiesta',
    instruments: 'a tiple strumming the fast campesino rhythm, a requinto guitar playing melodic runs between the vocal lines, a guacharaca scraper, a plain acoustic guitar holding the chords, and a simple upright acoustic bass — completely acoustic, no brass or electronics',
    tempo: 'lively campesino tempo around 130 BPM with a bouncy, danceable feel',
    vocals: 'a cheerful, down-to-earth male voice with a warm rural Colombian Andean accent, witty and storytelling',
    backing: 'a group of male voices joining loudly on the chorus, warm and untrained, like neighbours singing along on a patio',
    ambience: 'an Andean village patio: distant roosters, mountain wind, and footsteps on a wooden floor',
    production: 'raw, warm acoustic string-band production, rustic and full of character',
    avoid: 'electronic drums, synthesizers, urban or EDM production, brass horns'
  },

  cumbia: {
    label: 'Colombian cumbia (festive tropical cumbia)',
    aliases: ['cumbia', 'tropical', 'fiesta tropical'],
    narrative: 'fiesta',
    instruments: 'a lead accordion playing the cumbia melody, a guacharaca scraper, a caja vallenata, an alegre drum improvising over the steady heartbeat of the llamador drum, maracas, a groovy electric bass, and bright brass stabs answering every vocal phrase',
    tempo: 'danceable tropical tempo around 95 BPM with an irresistible two-step cumbia groove',
    vocals: 'a warm, cheerful lead voice with a festive Colombian coastal flavour',
    backing: 'a lively mixed group singing the chorus together with whistles and "¡oye!" shouts',
    ambience: 'a beach party at night: waves far in the distance, crowd whistles and festive shouts',
    production: 'bright tropical mix with percussion forward and warm analog character',
    avoid: 'distorted guitars, EDM drops, heavy trap drums, melancholic mood'
  },

  balada: {
    label: 'balada romántica (Latin romantic ballad)',
    aliases: ['balada romantica', 'balada', 'romantica'],
    narrative: 'amor',
    instruments: 'a grand piano leading with expressive rubato in the verses, a lush string section of violins, violas and cellos swelling into every chorus, a nylon-string guitar arpeggiating underneath, a fretless bass sliding between notes, and soft brushed drums that only enter at the chorus',
    tempo: 'slow, emotional tempo around 68 BPM that leaves room for the vocal to breathe',
    vocals: 'an intimate and emotive lead vocal, tender and close in the verses, opening up powerfully in the chorus',
    backing: 'soft layered harmony vocals doubling the chorus melody a third and an octave above, appearing only in the final chorus',
    ambience: 'a large warm concert-hall reverb tail, faint piano pedal and hammer noise, and an audible breath before the biggest lines',
    production: 'polished cinematic ballad production, warm reverb, building dynamically from verse to chorus',
    avoid: 'aggressive percussion, distorted guitars, electronic drops, fast tempo'
  },

  bolero: {
    label: 'bolero clásico (classic Latin bolero)',
    aliases: ['bolero', 'trio romantico', 'requinto'],
    narrative: 'amor',
    instruments: 'a requinto guitar playing melodic fills between every single vocal phrase, two rhythm guitars strumming the classic bolero pattern, soft claves marking the rhythm, a gently played bongó and maracas — no drum kit and no bass guitar',
    tempo: 'slow, nostalgic bolero tempo around 66 BPM with the classic bolero clave rhythm',
    vocals: 'a deeply emotional, romantic tenor lead voice with rich vibrato, nostalgic and heartfelt',
    backing: 'classic trio harmony — three male voices in tight close harmony carrying most of the song together, in the tradition of the great bolero trios',
    ambience: 'a small 1950s cabaret: warm tube-amp hum, a very natural close room, and the faint sound of glasses',
    production: 'warm, intimate, vintage acoustic bolero ensemble sound, nostalgic and elegant',
    avoid: 'drum kit, electric guitars, synthesizers, upbeat dance tempo'
  },

  bachata: {
    label: 'bachata dominicana',
    aliases: ['bachata'],
    narrative: 'amor',
    instruments: 'a lead requinto guitar playing the signature bachata arpeggios and runs, a second guitar strumming the syncopated rhythm, a güira scraper marking the beat, a bongó playing the classic bachata pattern, and a melodic bass shadowing the guitar',
    tempo: 'romantic bachata tempo around 130 BPM with the classic bachata guitar syncopation',
    vocals: 'a passionate, romantic male lead voice',
    backing: 'two soft male harmony voices joining on the chorus in thirds',
    ambience: 'a warm Caribbean night: a light natural room, the distant ocean, no crowd',
    production: 'warm, romantic Dominican bachata production',
    avoid: 'brass sections, electronic drums, EDM synths'
  },

  pop: {
    label: 'modern Latin pop',
    aliases: ['pop latino', 'pop moderno', 'pop'],
    narrative: 'fiesta',
    instruments: 'bright plucked synths carrying the hook, layered acoustic and clean electric guitars, punchy programmed drums with a crisp clap on the backbeat, deep sub bass, light latin percussion (shaker and conga) underneath, and a memorable synth or whistled hook in the chorus',
    tempo: 'upbeat contemporary tempo around 105 BPM with a radio-friendly groove',
    vocals: 'a youthful, polished contemporary lead vocal with rhythmic phrasing',
    backing: 'stacked vocal harmonies plus gang-vocal layers lifting the chorus, with rhythmic "oh-oh-oh" hooks between lines',
    ambience: 'subtle riser and reverse-cymbal sweeps before each chorus and a light crowd "hey" layer under the hook',
    production: 'glossy modern pop mix, wide and punchy, radio-ready master with natural dynamics',
    avoid: 'heavy distortion, orchestral scoring, lo-fi noise, dated production'
  },

  acustico: {
    label: 'intimate acoustic singer-songwriter',
    aliases: ['acustico', 'acoustic', 'guitarra y voz', 'unplugged'],
    narrative: 'amor',
    instruments: 'a single fingerpicked nylon-string guitar as the foundation, played close and detailed with audible finger movement along the strings, a soft cajón entering halfway through, an upright bass, and a distant string pad — nothing else',
    tempo: 'gentle, unhurried tempo around 80 BPM with a natural, human feel',
    vocals: "a warm, close-mic'd, slightly breathy lead vocal, sincere and conversational",
    backing: 'a gentle double-tracked harmony from the same voice, appearing only on the chorus',
    ambience: 'a small warm wooden room: a chair creak, audible breath, the intimacy of a live one-take recording',
    production: 'organic and minimal, close and intimate, like a live take in a small room',
    avoid: 'drum machines, synthesizers, heavy production, loud mastering'
  },

  reggaeton: {
    label: 'reggaetón / Latin urban',
    aliases: ['reggaeton', 'urbano', 'dembow', 'trap latino', 'trap'],
    narrative: 'urbano',
    instruments: 'the classic dembow drum pattern, a deep 808 sub bass sliding between notes, snappy claps over a tight snare, marimba-style plucked synth chords, atmospheric pads, and a filtered vocal-chop hook',
    tempo: 'club tempo around 95 BPM with a hypnotic dembow bounce',
    vocals: 'a rhythmic melodic urban lead vocal, confident and modern, with light tuning',
    backing: 'layered ad-libs answering every line, doubled hooks, and short "eh!" and "wuh!" shouts',
    ambience: 'club atmosphere: subtle crowd noise, an air-horn on the drop, and reverse-cymbal risers into each chorus',
    production: 'punchy modern urban mix, heavy low end, tight and club-ready',
    avoid: 'acoustic folk instruments, orchestral strings, rock guitars, slow ballad tempo'
  },

  reggae: {
    label: 'reggae tropical en español (Latin Caribbean reggae)',
    aliases: ['reggae en espanol', 'reggae', 'ragga'],
    narrative: 'fiesta',
    instruments: 'an offbeat skank rhythm guitar chopping every upbeat, a bubbling organ playing the classic reggae shuffle, a deep round bassline carrying the real melody, a one-drop drum pattern with the kick landing on beat three, and a light horn section answering the vocal',
    tempo: 'laid-back reggae riddim tempo around 80 BPM with a relaxed offbeat groove',
    vocals: 'a warm, laid-back lead voice with relaxed island phrasing, singing in Spanish with a tropical Caribbean feel',
    backing: 'smooth harmony voices echoing the last words of each line, relaxed and unhurried',
    ambience: 'a warm open-air Caribbean session: light spring-reverb echo tails, distant waves, a relaxed room',
    production: 'warm analog reggae production, deep bass forward in the mix, spacious and echo-laden',
    avoid: 'aggressive drums, EDM synths, fast tempo, distorted guitars'
  },

  rock: {
    label: 'Latin pop rock',
    aliases: ['pop rock', 'rock'],
    narrative: 'urbano',
    instruments: 'driving distorted electric rhythm guitars doubled hard left and right, a melodic lead guitar answering every vocal line, a live drum kit that opens up with crash cymbals in the chorus, a punchy electric bass locked to the kick, and a full guitar solo in the bridge',
    tempo: 'energetic tempo around 130 BPM with a strong backbeat',
    vocals: 'an energetic rock lead vocal with grit and passion, soaring in the chorus',
    backing: 'anthemic gang backing vocals shouting the chorus together, plus "whoa-oh" chants between phrases',
    ambience: 'a big live room: natural drum room reverb, faint amp hum and pick noise, a stadium crowd feel',
    production: 'big live rock production with wide guitars and powerful roomy drums',
    avoid: 'electronic dance drops, tropical percussion, soft ambient textures'
  },

  rap: {
    label: 'rap / hip-hop',
    aliases: ['rap', 'hip hop', 'hiphop', 'freestyle'],
    narrative: 'urbano',
    instruments: 'punchy boom-bap drum breaks with a dusty cracking snare, a deep sampled upright bassline, scratched vinyl textures on the turntable between phrases, and a simple looped soul or piano sample as the main hook',
    tempo: 'classic hip-hop tempo around 90 BPM with a laid-back head-nodding groove',
    vocals: 'a confident, rhythmic RAPPED vocal delivery with clear diction and clever rhyme flow — spoken-flow rap, not sung melody',
    backing: 'a hype-man shouting the last word of every bar, plus a simple chanted group hook',
    ambience: 'warm vinyl crackle running all the way through, a faint city street layer, and analog tape hiss',
    production: 'raw boom-bap hip-hop production with warm vinyl crackle and punchy low end',
    avoid: 'sung melodic ballad vocals, orchestral strings, EDM drops'
  },

  lofi: {
    label: 'lo-fi chill hop',
    aliases: ['lo-fi', 'lofi', 'chill hop', 'chillhop', 'chill'],
    narrative: 'nostalgico',
    instruments: 'a mellow Rhodes electric piano playing jazzy seventh chords, laid-back boom-bap drums played noticeably behind the beat, a warm upright bass, and a soft muted trumpet drifting through a lazy counter-melody',
    tempo: 'relaxed tempo around 78 BPM with a loose, behind-the-beat swing',
    vocals: 'a soft, close, relaxed lead vocal, almost spoken, gently filtered',
    backing: 'airy hazy harmony vocals floating far behind the lead, heavily filtered',
    ambience: 'heavy vinyl crackle, soft rain against a window, a distant city hum, and the faint hiss of an old tape',
    production: 'warm tape saturation, low-pass filtered, nostalgic and cozy, never bright or harsh',
    avoid: 'loud aggressive drums, EDM synths, distortion, high energy'
  },

  electronica: {
    label: 'Latin EDM / electronic dance',
    aliases: ['electronica', 'edm', 'electronic', 'house', 'techno', 'dance'],
    narrative: 'fiesta',
    instruments: 'supersaw synth leads, arpeggiated sequences running underneath, sidechained pads pumping in time with the kick, a four-on-the-floor kick, punchy claps and a snare roll building into the drop, and a euphoric lead melody carrying the chorus',
    tempo: 'high-energy tempo around 126 BPM built around tension and release',
    vocals: 'a bright anthemic lead vocal, processed and wide, soaring over the drop',
    backing: 'huge stacked and very wide vocal layers in the drop, plus chopped vocal hooks',
    ambience: 'a festival at night: white-noise risers, downlifters after the drop, and a huge crowd cheering as the drop hits',
    production: 'festival-ready electronic production, massive stereo width, punchy and energetic with controlled dynamics',
    avoid: 'acoustic folk instruments, live orchestra, lo-fi textures, slow tempo'
  },

  jingleCorporativo: {
    label: 'corporate jingle (upbeat brand/company anthem)',
    aliases: ['jingle corporativo', 'jingle empresarial', 'cancion corporativa', 'himno corporativo', 'jingle'],
    narrative: 'corporativo',
    instruments: 'a punchy corporate-pop bed: clean strummed electric guitar, bright synth plucks carrying the hook, a tight modern drum groove with crisp claps on the backbeat, a rounded synth bass, and a confident brass-stab accent underlining the chorus',
    tempo: 'upbeat, confident tempo around 118 BPM, energetic but polished',
    vocals: 'a bright, confident, clearly-enunciated lead voice with an optimistic advertisement-jingle energy, professional and upbeat',
    backing: 'a small group of enthusiastic voices joining in unison on the hook/slogan line, like a company team chanting a motto together',
    ambience: 'a brief warm round of office applause at the end, otherwise a clean, polished studio space with no other background noise',
    production: 'clean, bright, polished corporate/advertisement production, radio-jingle ready with a punchy and memorable hook',
    avoid: 'dark or melancholic mood, distortion, slow ballad tempo, aggressive or heavy genres'
  },

  villancico: {
    label: 'villancico navideño (traditional Spanish-language Christmas carol)',
    aliases: ['villancico', 'navideno', 'cancion de navidad', 'christmas carol', 'navidad'],
    narrative: 'navidad',
    instruments: 'sleigh bells keeping a bright festive pulse, a warm acoustic guitar strumming simple chords, a glockenspiel doubling the melody, a cozy string section swelling into the chorus, a soft handbell choir accenting the hook, and light hand percussion (tambourine, pandereta) for a festive lift',
    tempo: 'warm, moderate tempo around 100 BPM with a festive, swaying feel',
    vocals: 'a warm, joyful lead voice full of Christmas cheer, inviting the whole family to sing along',
    backing: 'a full choir joining in rich harmony on the chorus, like family and friends gathered close and singing together',
    ambience: 'sleigh bells jingling, a crackling fireplace, and the faint warm murmur of a family gathered close on a quiet winter night',
    production: 'warm, festive, classic Christmas-carol production, rich and cozy, radio-ready holiday warmth',
    avoid: 'dark or somber mood, aggressive drums, EDM synths, distortion'
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
    production: 'ultra-polished, wide, dynamic modern pop production',
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
    profile.ambience ? `Background texture and ambience: ${profile.ambience}.` : '',
    `Structure: ${structureFor(durationSec)}.`,
    ...modifiers,
    voiceOverride,
    `The lyrics must be performed entirely in natural Latin American Spanish with a neutral Colombian accent, never in English.`,
    `This is a personalized gift song. The dedication, written by the customer, is: "${dedication}".`,
    story ? `Weave these personal details naturally into the verses: ${story}.` : '',
    `The chorus must be catchy and repeated, and must name the person the song is dedicated to so it is unmistakably personal.`,
    `Production: ${profile.production}.`,
    `Avoid: ${profile.avoid}.`,
    `Mixing and mastering: use natural, professional dynamic range. Avoid brickwall limiting, excessive loudness maximization or heavy compression that could make the lead vocal, harmonies or choir sound harsh, distorted, squashed or fatiguing. Keep the true peak with a few dB of headroom below 0 dBFS, and make sure the vocals stay clear, present and undistorted at every moment of the song.`
  ]
    .filter(Boolean)
    .join(' ');
};
