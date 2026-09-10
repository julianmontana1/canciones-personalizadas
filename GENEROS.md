# 🎼 Catálogo de Géneros — SerenatIA

Este documento se genera a partir del código real (`server/genreProfiles.js` y
`src/components/UserView.jsx`), así que refleja exactamente lo que la aplicación
le pide a la IA en este momento.

## Cómo funciona

Cuando un cliente crea una canción, el servidor **no** envía el nombre del género a
secas. Construye un prompt largo y muy específico combinando:

1. La **ficha técnica del género** (lo que ves abajo): instrumentos con técnicas
   concretas, tempo, tipo de voz, composición exacta del coro y sonidos de fondo.
2. La **estructura** según la duración elegida (30s no lleva puente, 180s sí).
3. El **idioma** (español latino, acento colombiano neutro).
4. La **dedicatoria y la historia** que escribió el cliente.
5. La **voz elegida** (masculina / femenina / ambas / cualquiera).
6. Las **instrucciones de mezcla y masterización** (rango dinámico natural, sin
   compresión excesiva que distorsione voces y coros).

Después, el audio que devuelve la IA pasa por un normalizador de loudness en el
servidor (`server/audioLimiter.js`) que garantiza `-14 LUFS` y un techo seguro
de `-1.5 dBTP` en **todas** las canciones, sin importar el género.

## Cómo probar un género

Crea una canción normal desde la app eligiendo el género. Todo lo que aparece en
su ficha se envía automáticamente. Si quieres afinar un género, edita su entrada
en `server/genreProfiles.js` y vuelve a generar.

**Total: 25 géneros.**

---

## Infantil (6 géneros)

### 🌙 Canción de Dormir / Nana

> Suave, relajante, piano y caja de música

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | a delicate wind-up music box carrying the main melody, a soft celesta doubling it one octave above, a warm felt-hammer piano playing simple root-position chords, gentle nylon harp arpeggios rolling underneath, and one sustained warm analog pad — absolutely no drums or percussion of any kind |
| **Tempo** | very slow and soothing, around 62 BPM, in a gentle 6/8 rocking lullaby feel |
| **Voz principal** | an extremely soft, tender maternal female voice sung barely above a whisper, very close to the microphone, with audible gentle breath between phrases, never belting |
| **Coros** | a single soft wordless humming line plus airy "la-la-la" harmonies a third above, mixed far back and blurred into the reverb |
| **Sonidos de fondo** | the faint mechanical wind-down of the music box between phrases, soft rain against a window far away, and a very low warm room tone — nothing sharp, sudden or startling |
| **Producción** | quiet, warm and cocooning, wide soft reverb, gentle natural dynamics with soft transients and no loudness-maximizing limiting, calming from start to finish |
| **Evitar** | drums, brass, loud percussion, distortion, sudden dynamic changes, anything startling or energetic |

### 🎈 Fiesta Infantil

> Movida y bailable, para saltar y bailar

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | bouncy glockenspiel and marimba playing the hook in unison, a bright ukulele strumming on every offbeat, playful synth plucks, tight handclaps on beats 2 and 4, a rising slide whistle right before each chorus, cowbell accents, and a simple punchy kick-and-clap groove |
| **Tempo** | very energetic, bouncy dance tempo around 128 BPM in a bright major key, built to make kids jump and move |
| **Voz principal** | a cheerful, clear and highly rhythmic lead voice singing short, catchy, easy-to-repeat phrases a child can chant and dance along to |
| **Coros** | a choir of about eight children echoing every catchy phrase straight back in unison, call-and-response style, slightly imperfect and bursting with energy |
| **Sonidos de fondo** | a group of children laughing and shouting "¡eh!" between phrases, party whistles, and the thump of small feet jumping on the floor |
| **Producción** | bright, clean, punchy and highly repetitive/chantable, everything clear and up-front, designed to get kids up and jumping |
| **Evitar** | dark or melancholic mood, distortion, aggressive drums, complex harmony, slow tempo, birthday-party references |

### 🎂 Cumpleaños Infantil

> Fiesta de cumpleaños con globos y torta

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | bouncy glockenspiel, a playful honky-tonk-flavoured upright piano, strummed ukulele, party whistles and kazoo, handclaps, tambourine, and a bright celebratory hook played on tubular bells |
| **Tempo** | happy, bouncy birthday-party tempo around 118 BPM in a bright major key |
| **Voz principal** | a cheerful, warm lead voice full of birthday-party energy, inviting the birthday child to dance and blow out the candles |
| **Coros** | a children's choir shouting the birthday child's name in unison and singing along enthusiastically on every chorus |
| **Sonidos de fondo** | children cheering and clapping, party horns, one balloon popping, and the clatter of plates and cutlery from a small party in the background |
| **Producción** | bright, clean, playful and festive, balloons-and-cake birthday-party atmosphere |
| **Evitar** | dark or melancholic mood, distortion, aggressive drums, complex harmony |

### 📺 Infantil Clásica

> Estilo clásico de toda la vida, tierno y educativo

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | a simple nylon acoustic guitar strumming basic open chords, a gentle upright piano, a soft xylophone doubling the melody note for note, a light triangle and woodblock keeping very simple time, and a warm accordion holding pads underneath — like a 1980s children's television program |
| **Tempo** | gentle, moderate sing-along tempo around 100 BPM, simple and easy for a small child to follow |
| **Voz principal** | a warm, friendly, clearly-enunciated lead voice with a classic educational children's-show quality, singing a simple and very repetitive melody |
| **Coros** | a small choir of about six children singing the repeated phrases in plain unison with no harmony, very natural and charmingly a little out of tune |
| **Sonidos de fondo** | the warm analog hiss of an old tape recording and a faint classroom or living-room room tone |
| **Producción** | warm, simple, nostalgic classic children's-program production, clean and gentle |
| **Evitar** | aggressive drums, EDM synths, dark mood, complex modern production, distortion |

### 🌟 Infantil Moderna

> Ritmo actual y pegajoso, apto para niños

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | bright modern pop synth plucks carrying the hook, clean electric guitar with a light chorus effect, punchy but soft programmed drums, finger snaps and claps, a playful rounded sub bass, and a catchy synth lead in the chorus |
| **Tempo** | upbeat modern pop tempo around 110 BPM, current and radio-friendly but clean |
| **Voz principal** | a youthful, bright, clearly-enunciated lead voice with a modern pop feel, fully appropriate and clean for children |
| **Coros** | stacked youthful voices doubled in octaves on the chorus hook, plus short punchy "hey!" shouts between phrases |
| **Sonidos de fondo** | subtle riser sweeps building into each chorus and a small crowd "wooo" on the drop into the hook |
| **Producción** | glossy modern pop production, but kid-appropriate: no innuendo, no dark themes, clean and colorful |
| **Evitar** | explicit or mature themes, heavy distortion, dark mood, overly complex harmony |

### 🎠 Rondas Infantiles

> Cancioncitas de juego para cantar en grupo

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | a single strummed nylon guitar or ukulele playing only two or three simple chords, a wooden xylophone doubling the melody, handclaps and finger snaps keeping the pulse, and a small triangle — no drum kit, no bass, nothing electronic |
| **Tempo** | simple skipping tempo around 100 BPM, easy for a circle of children to clap and sing along to |
| **Voz principal** | a bright, playful group of children singing together in unison with a simple singsong melody |
| **Coros** | one child voice leading each line and a full circle of children repeating it straight back in unison, exactly like a playground game |
| **Sonidos de fondo** | a schoolyard at recess: distant children playing, open outdoor air, and footsteps circling on concrete |
| **Producción** | warm, natural, unplugged schoolyard-game feel, minimal and clean, no studio effects |
| **Evitar** | electronic instruments, complex harmony, adult themes, dark or intense mood, drum machines |

---

## Amor y Amistad (8 géneros)

### 🌹 Salsa Rosa

> Salsa romántica, suave y dedicada al amor

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | a smooth piano montuno played softly in the mid register, congas and timbales kept brushed and restrained, a melodic bass tumbao, sweetened string pads underneath, and a mellow horn section playing legato countermelodies instead of stabs |
| **Tempo** | relaxed romantic salsa tempo around 96 BPM, smoother and less frantic than salsa brava |
| **Voz principal** | a tender, romantic male lead voice singing sweetly with emotional restraint rather than aggressive improvisation |
| **Coros** | two soft harmony voices supporting the chorus in thirds, warm and close, never shouted |
| **Sonidos de fondo** | an intimate club just before closing, very light natural room reverb, no crowd noise at all |
| **Producción** | polished romantic salsa-ballad production, warm and sweet, radio-friendly |
| **Evitar** | aggressive brass stabs, fast frantic tempo, rough sonero improvisation, harsh mixing |

### 🎺 Mariachi Tradicional

> Trompetas mexicanas, violines y guitarrón

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | a violin section of six playing in unison and in thirds, two trumpets harmonized in thirds with a proud wide vibrato, a vihuela strumming the mánico rhythm, a guitarrón walking the bass in octaves, and a classical guitar filling out the harmony |
| **Tempo** | moderate ranchera tempo around 90 BPM with a proud, swaying feel |
| **Voz principal** | a powerful male ranchera voice with rich vibrato, long sustained notes and heartfelt gritos |
| **Coros** | a warm group of male voices joining in harmony on the chorus, with a heartfelt "¡ay!" grito right before the final verse |
| **Sonidos de fondo** | an outdoor serenade at night: crickets, a quiet distant street, and a natural open-air acoustic |
| **Producción** | traditional acoustic mariachi ensemble captured in a natural room |
| **Evitar** | drum kit, synthesizers, electric bass, electronic percussion |

### 🪗 Vallenato

> Acordeón, caja y guacharaca contando una historia

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | a lead diatonic accordion carrying the melody with quick bellows shakes and ornamental runs between vocal lines, a caja vallenata hand drum driving the paseo rhythm, a guacharaca scraper on every offbeat, and a simple electric bass following the root — no brass and no drum kit |
| **Tempo** | moderate paseo/vallenato tempo around 85 BPM with a swaying, storytelling groove |
| **Voz principal** | a warm, expressive male voice telling a heartfelt story with classic Colombian vallenato phrasing |
| **Coros** | mostly a solo storytelling voice, with two male voices joining only on the final line of each chorus |
| **Sonidos de fondo** | a warm Colombian courtyard at dusk: cicadas, distant voices, and a light breeze |
| **Producción** | authentic acoustic vallenato ensemble, warm and intimate, accordion prominent in the mix |
| **Evitar** | brass horns, electronic drums, synthesizers, heavy dance production |

### ❤️ Balada Romántica

> Emotiva, piano acústico y cuerdas

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | a grand piano leading with expressive rubato in the verses, a lush string section of violins, violas and cellos swelling into every chorus, a nylon-string guitar arpeggiating underneath, a fretless bass sliding between notes, and soft brushed drums that only enter at the chorus |
| **Tempo** | slow, emotional tempo around 68 BPM that leaves room for the vocal to breathe |
| **Voz principal** | an intimate and emotive lead vocal, tender and close in the verses, opening up powerfully in the chorus |
| **Coros** | soft layered harmony vocals doubling the chorus melody a third and an octave above, appearing only in the final chorus |
| **Sonidos de fondo** | a large warm concert-hall reverb tail, faint piano pedal and hammer noise, and an audible breath before the biggest lines |
| **Producción** | polished cinematic ballad production, warm reverb, building dynamically from verse to chorus |
| **Evitar** | aggressive percussion, distorted guitars, electronic drops, fast tempo |

### 🎻 Bolero

> Guitarra requinto y voz nostálgica de trío

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | a requinto guitar playing melodic fills between every single vocal phrase, two rhythm guitars strumming the classic bolero pattern, soft claves marking the rhythm, a gently played bongó and maracas — no drum kit and no bass guitar |
| **Tempo** | slow, nostalgic bolero tempo around 66 BPM with the classic bolero clave rhythm |
| **Voz principal** | a deeply emotional, romantic tenor lead voice with rich vibrato, nostalgic and heartfelt |
| **Coros** | classic trio harmony — three male voices in tight close harmony carrying most of the song together, in the tradition of the great bolero trios |
| **Sonidos de fondo** | a small 1950s cabaret: warm tube-amp hum, a very natural close room, and the faint sound of glasses |
| **Producción** | warm, intimate, vintage acoustic bolero ensemble sound, nostalgic and elegant |
| **Evitar** | drum kit, electric guitars, synthesizers, upbeat dance tempo |

### 🌺 Bachata

> Guitarra dominicana romántica, íntima y bailable

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | a lead requinto guitar playing the signature bachata arpeggios and runs, a second guitar strumming the syncopated rhythm, a güira scraper marking the beat, a bongó playing the classic bachata pattern, and a melodic bass shadowing the guitar |
| **Tempo** | romantic bachata tempo around 130 BPM with the classic bachata guitar syncopation |
| **Voz principal** | a passionate, romantic male lead voice |
| **Coros** | two soft male harmony voices joining on the chorus in thirds |
| **Sonidos de fondo** | a warm Caribbean night: a light natural room, the distant ocean, no crowd |
| **Producción** | warm, romantic Dominican bachata production |
| **Evitar** | brass sections, electronic drums, EDM synths |

### 🪕 Acústico Íntimo

> Guitarra acústica de palo y voz cálida

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | a single fingerpicked nylon-string guitar as the foundation, played close and detailed with audible finger movement along the strings, a soft cajón entering halfway through, an upright bass, and a distant string pad — nothing else |
| **Tempo** | gentle, unhurried tempo around 80 BPM with a natural, human feel |
| **Voz principal** | a warm, close-mic'd, slightly breathy lead vocal, sincere and conversational |
| **Coros** | a gentle double-tracked harmony from the same voice, appearing only on the chorus |
| **Sonidos de fondo** | a small warm wooden room: a chair creak, audible breath, the intimacy of a live one-take recording |
| **Producción** | organic and minimal, close and intimate, like a live take in a small room |
| **Evitar** | drum machines, synthesizers, heavy production, loud mastering |

### ☕ Lo-Fi Chill Hop

> Relajado, nostálgico, estilo vinilo

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | a mellow Rhodes electric piano playing jazzy seventh chords, laid-back boom-bap drums played noticeably behind the beat, a warm upright bass, and a soft muted trumpet drifting through a lazy counter-melody |
| **Tempo** | relaxed tempo around 78 BPM with a loose, behind-the-beat swing |
| **Voz principal** | a soft, close, relaxed lead vocal, almost spoken, gently filtered |
| **Coros** | airy hazy harmony vocals floating far behind the lead, heavily filtered |
| **Sonidos de fondo** | heavy vinyl crackle, soft rain against a window, a distant city hum, and the faint hiss of an old tape |
| **Producción** | warm tape saturation, low-pass filtered, nostalgic and cozy, never bright or harsh |
| **Evitar** | loud aggressive drums, EDM synths, distortion, high energy |

---

## Celebración (11 géneros)

### 🥳 Cumpleaños

> Festiva y alegre, para celebrar en grande

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | bright strummed acoustic guitar, clean electric guitar accents, festive congas and tambourine, a punchy horn section stabbing on every chorus, handclaps on all four beats, and a big singable melodic hook |
| **Tempo** | upbeat celebratory tempo around 120 BPM, danceable and joyful |
| **Voz principal** | a warm, joyful lead voice full of celebration energy, inviting everyone in the room to sing along |
| **Coros** | a big group of untrained friends-and-family voices singing the chorus together, joyful and a little rough around the edges |
| **Sonidos de fondo** | a room full of friends and family cheering, glasses toasting, a party horn, and applause at the very end |
| **Producción** | bright, festive party production, warm and full, radio-ready |
| **Evitar** | somber mood, minimalism, slow ballad tempo |

### 🤠 Banda Sinaloense

> Metales potentes, tambora, tuba y sabor norteño

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | a full Sinaloense brass banda: tambora bass drum struck with the mallet on the downbeat, tarola snare rolling into every phrase, sousaphone tuba walking the bassline in octaves, two clarinets carrying the melody in harmony, three trumpets harmonized in thirds, trombones answering them, and charchetas (alto horns) filling the middle register |
| **Tempo** | upbeat celebratory tempo around 125 BPM driven by the tuba-and-tambora groove |
| **Voz principal** | a powerful male ranchera voice, open-throated and proud, with occasional festive gritos |
| **Coros** | a full group of male voices shouting the chorus back in unison, with an occasional "¡ay ay ay!" grito thrown over the top |
| **Sonidos de fondo** | a live plaza party: bottles clinking, whistles and festive gritos from the crowd between phrases |
| **Producción** | live-band feel with the brass forward in the mix, wide and punchy |
| **Evitar** | synthesizers, drum machines, electric guitars, autotune, ambient pads |

### 💃 Salsa Brava / Caribeña

> Trompetas vivas, piano montuno y congas

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | piano driving a montuno in octaves, congas locked into a tumbao, timbales firing an abanico fill to announce every chorus, bongó switching to the campana bell in the montuno section, güiro and maracas riding on top, an upright-feel bass playing a syncopated tumbao, and a tight horn section of two trumpets and a trombone alternating sharp stabs with long moñas |
| **Tempo** | energetic dance tempo around 190 BPM locked to the clave, tight and syncopated |
| **Voz principal** | a passionate male sonero lead improvising soneos over the montuno section |
| **Coros** | a classic three-voice coro singing the hook in close thirds, trading call-and-response with the sonero who improvises between every repetition |
| **Sonidos de fondo** | a packed dance hall: crowd cheers, a sharp celebratory shout, glasses and clave sticks alive in the room |
| **Producción** | live salsa orchestra sound, crisp percussion, bright horns, wide stereo image |
| **Evitar** | electronic drums, synth pads, trap hi-hats, ballad tempo |

### 🌾 Carranga

> Guitarra campesina, guacharaca y sabor andino

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | a tiple strumming the fast campesino rhythm, a requinto guitar playing melodic runs between the vocal lines, a guacharaca scraper, a plain acoustic guitar holding the chords, and a simple upright acoustic bass — completely acoustic, no brass or electronics |
| **Tempo** | lively campesino tempo around 130 BPM with a bouncy, danceable feel |
| **Voz principal** | a cheerful, down-to-earth male voice with a warm rural Colombian Andean accent, witty and storytelling |
| **Coros** | a group of male voices joining loudly on the chorus, warm and untrained, like neighbours singing along on a patio |
| **Sonidos de fondo** | an Andean village patio: distant roosters, mountain wind, and footsteps on a wooden floor |
| **Producción** | raw, warm acoustic string-band production, rustic and full of character |
| **Evitar** | electronic drums, synthesizers, urban or EDM production, brass horns |

### 🎉 Cumbia / Fiesta

> Sabor tropical, acordeón y ritmo bailable

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | a lead accordion playing the cumbia melody, a guacharaca scraper, a caja vallenata, an alegre drum improvising over the steady heartbeat of the llamador drum, maracas, a groovy electric bass, and bright brass stabs answering every vocal phrase |
| **Tempo** | danceable tropical tempo around 95 BPM with an irresistible two-step cumbia groove |
| **Voz principal** | a warm, cheerful lead voice with a festive Colombian coastal flavour |
| **Coros** | a lively mixed group singing the chorus together with whistles and "¡oye!" shouts |
| **Sonidos de fondo** | a beach party at night: waves far in the distance, crowd whistles and festive shouts |
| **Producción** | bright tropical mix with percussion forward and warm analog character |
| **Evitar** | distorted guitars, EDM drops, heavy trap drums, melancholic mood |

### ✨ Pop Latino Moderno

> Melódico, rítmico y pegadizo

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | bright plucked synths carrying the hook, layered acoustic and clean electric guitars, punchy programmed drums with a crisp clap on the backbeat, deep sub bass, light latin percussion (shaker and conga) underneath, and a memorable synth or whistled hook in the chorus |
| **Tempo** | upbeat contemporary tempo around 105 BPM with a radio-friendly groove |
| **Voz principal** | a youthful, polished contemporary lead vocal with rhythmic phrasing |
| **Coros** | stacked vocal harmonies plus gang-vocal layers lifting the chorus, with rhythmic "oh-oh-oh" hooks between lines |
| **Sonidos de fondo** | subtle riser and reverse-cymbal sweeps before each chorus and a light crowd "hey" layer under the hook |
| **Producción** | glossy modern pop mix, wide and punchy, radio-ready master with natural dynamics |
| **Evitar** | heavy distortion, orchestral scoring, lo-fi noise, dated production |

### 🔥 Reggaetón / Urbano

> Beat bailable, dembow y ritmo moderno

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | the classic dembow drum pattern, a deep 808 sub bass sliding between notes, snappy claps over a tight snare, marimba-style plucked synth chords, atmospheric pads, and a filtered vocal-chop hook |
| **Tempo** | club tempo around 95 BPM with a hypnotic dembow bounce |
| **Voz principal** | a rhythmic melodic urban lead vocal, confident and modern, with light tuning |
| **Coros** | layered ad-libs answering every line, doubled hooks, and short "eh!" and "wuh!" shouts |
| **Sonidos de fondo** | club atmosphere: subtle crowd noise, an air-horn on the drop, and reverse-cymbal risers into each chorus |
| **Producción** | punchy modern urban mix, heavy low end, tight and club-ready |
| **Evitar** | acoustic folk instruments, orchestral strings, rock guitars, slow ballad tempo |

### 🌴 Reggae

> Ritmo relajado, bajo profundo y sabor caribeño

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | an offbeat skank rhythm guitar chopping every upbeat, a bubbling organ playing the classic reggae shuffle, a deep round bassline carrying the real melody, a one-drop drum pattern with the kick landing on beat three, and a light horn section answering the vocal |
| **Tempo** | laid-back reggae riddim tempo around 80 BPM with a relaxed offbeat groove |
| **Voz principal** | a warm, laid-back lead voice with relaxed island phrasing, singing in Spanish with a tropical Caribbean feel |
| **Coros** | smooth harmony voices echoing the last words of each line, relaxed and unhurried |
| **Sonidos de fondo** | a warm open-air Caribbean session: light spring-reverb echo tails, distant waves, a relaxed room |
| **Producción** | warm analog reggae production, deep bass forward in the mix, spacious and echo-laden |
| **Evitar** | aggressive drums, EDM synths, fast tempo, distorted guitars |

### 🎸 Rock

> Guitarras eléctricas potentes y batería viva

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | driving distorted electric rhythm guitars doubled hard left and right, a melodic lead guitar answering every vocal line, a live drum kit that opens up with crash cymbals in the chorus, a punchy electric bass locked to the kick, and a full guitar solo in the bridge |
| **Tempo** | energetic tempo around 130 BPM with a strong backbeat |
| **Voz principal** | an energetic rock lead vocal with grit and passion, soaring in the chorus |
| **Coros** | anthemic gang backing vocals shouting the chorus together, plus "whoa-oh" chants between phrases |
| **Sonidos de fondo** | a big live room: natural drum room reverb, faint amp hum and pick noise, a stadium crowd feel |
| **Producción** | big live rock production with wide guitars and powerful roomy drums |
| **Evitar** | electronic dance drops, tropical percussion, soft ambient textures |

### 🎤 Rap

> Flow rapeado, beats boom-bap y rimas con actitud

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | punchy boom-bap drum breaks with a dusty cracking snare, a deep sampled upright bassline, scratched vinyl textures on the turntable between phrases, and a simple looped soul or piano sample as the main hook |
| **Tempo** | classic hip-hop tempo around 90 BPM with a laid-back head-nodding groove |
| **Voz principal** | a confident, rhythmic RAPPED vocal delivery with clear diction and clever rhyme flow — spoken-flow rap, not sung melody |
| **Coros** | a hype-man shouting the last word of every bar, plus a simple chanted group hook |
| **Sonidos de fondo** | warm vinyl crackle running all the way through, a faint city street layer, and analog tape hiss |
| **Producción** | raw boom-bap hip-hop production with warm vinyl crackle and punchy low end |
| **Evitar** | sung melodic ballad vocals, orchestral strings, EDM drops |

### ⚡ Electrónica / EDM

> Sintetizadores enérgicos y fiesta total

| Campo | Lo que se le pide a la IA |
|---|---|
| **Instrumentos** | supersaw synth leads, arpeggiated sequences running underneath, sidechained pads pumping in time with the kick, a four-on-the-floor kick, punchy claps and a snare roll building into the drop, and a euphoric lead melody carrying the chorus |
| **Tempo** | high-energy tempo around 126 BPM built around tension and release |
| **Voz principal** | a bright anthemic lead vocal, processed and wide, soaring over the drop |
| **Coros** | huge stacked and very wide vocal layers in the drop, plus chopped vocal hooks |
| **Sonidos de fondo** | a festival at night: white-noise risers, downlifters after the drop, and a huge crowd cheering as the drop hits |
| **Producción** | festival-ready electronic production, massive stereo width, punchy and energetic with controlled dynamics |
| **Evitar** | acoustic folk instruments, live orchestra, lo-fi textures, slow tempo |

---

## Ejemplo de prompt final completo

Así se ve el prompt real que recibe la IA para una Salsa Brava de 120 segundos,
voz masculina, con la historia del cliente ya integrada:

```
A high-quality, professionally produced salsa brava (Caribbean big-band salsa), 120 seconds long. Instrumentation: piano driving a montuno in octaves, congas locked into a tumbao, timbales firing an abanico fill to announce every chorus, bongó switching to the campana bell in the montuno section, güiro and maracas riding on top, an upright-feel bass playing a syncopated tumbao, and a tight horn section of two trumpets and a trombone alternating sharp stabs with long moñas. Tempo and feel: energetic dance tempo around 190 BPM locked to the clave, tight and syncopated. Lead vocal: a passionate male sonero lead improvising soneos over the montuno section. Backing vocals: a classic three-voice coro singing the hook in close thirds, trading call-and-response with the sonero who improvises between every repetition. Background texture and ambience: a packed dance hall: crowd cheers, a sharp celebratory shout, glasses and clave sticks alive in the room. Structure: intro, verse 1, chorus, verse 2, final chorus, resolved outro. Regardless of any other vocal description, the lead vocal must be sung by a male voice. The lyrics must be performed entirely in natural Latin American Spanish with a neutral Colombian accent, never in English. This is a personalized gift song. The dedication, written by the customer, is: "Para mi esposa Camila". Weave these personal details naturally into the verses: Nos conocimos bailando en Cali hace 10 años y desde entonces no nos hemos soltado. The chorus must be catchy and repeated, and must name the person the song is dedicated to so it is unmistakably personal. Production: live salsa orchestra sound, crisp percussion, bright horns, wide stereo image. Avoid: electronic drums, synth pads, trap hi-hats, ballad tempo. Mixing and mastering: use natural, professional dynamic range. Avoid brickwall limiting, excessive loudness maximization or heavy compression that could make the lead vocal, harmonies or choir sound harsh, distorted, squashed or fatiguing. Keep the true peak with a few dB of headroom below 0 dBFS, and make sure the vocals stay clear, present and undistorted at every moment of the song.
```

---

## Estilos libres

Si el cliente escribe un estilo que no está en la lista, el sistema:

1. Busca coincidencias con los alias de los 25 géneros (por ejemplo
   "vallenato del viejo" → Vallenato, "corrido tumbado" → Banda Sinaloense).
2. Si no encuentra, prueba con un diccionario de géneros comunes fuera del picker
   (rap, merengue, bachata, tango, jazz, gospel, k-pop).
3. Si aun así no reconoce nada, le pide a la IA que interprete el nombre del
   género de forma auténtica en lugar de imponerle instrumentación genérica.

Además detecta modificadores de época ("de los 90", "del viejo", "retro") y los
agrega como instrucción de producción independiente del género.

Las referencias a canciones o artistas con derechos de autor (por ejemplo
"la vaca lola") se redirigen a una descripción genérica equivalente y **nunca**
se envían textualmente a la IA.
