// The full genre gallery shown in "Explora Estilos" — shared with AdminView's
// per-genre demo generator so both stay in sync with exactly one list of genres.
// `mood` groups genres by the occasion the customer has in mind (used by the mood
// filter pills), independent of their musical family.
export const GENRE_PRESETS = [
  // Niños & Dormir
  { id: 'dormir', mood: 'infantil', name: 'Canción de Dormir / Nana', desc: 'Suave, relajante, piano y caja de música', icon: '🌙', image: '/images/genero-nana.avif' },
  { id: 'infantil', mood: 'infantil', name: 'Fiesta Infantil', desc: 'Movida y bailable, para saltar y bailar', icon: '🎈', image: '/images/genero-infantil.avif' },
  { id: 'cumpleanosinfantil', mood: 'infantil', name: 'Cumpleaños Infantil', desc: 'Fiesta de cumpleaños con globos y torta', icon: '🎂', image: '/images/genero-cumpleanosinfantil.avif' },
  { id: 'infantilclasica', mood: 'infantil', name: 'Infantil Clásica', desc: 'Estilo clásico de toda la vida, tierno y educativo', icon: '📺', image: '/images/genero-infantilclasica.avif' },
  { id: 'infantilmoderna', mood: 'infantil', name: 'Infantil Moderna', desc: 'Ritmo actual y pegajoso, apto para niños', icon: '🌟', image: '/images/genero-infantilmoderna.avif' },
  { id: 'rondas', mood: 'infantil', name: 'Rondas Infantiles', desc: 'Cancioncitas de juego para cantar en grupo', icon: '🎠', image: '/images/genero-rondas.avif' },

  // Regional & Fiesta
  { id: 'cumpleanos', mood: 'celebracion', name: 'Cumpleaños', desc: 'Festiva y alegre, para celebrar en grande', icon: '🥳', image: '/images/genero-cumpleanos.avif' },
  { id: 'banda', mood: 'celebracion', name: 'Banda Sinaloense', desc: 'Metales potentes, tambora, tuba y sabor norteño', icon: '🤠', image: '/images/genero-banda.avif' },
  { id: 'salsa', mood: 'celebracion', name: 'Salsa Brava / Caribeña', desc: 'Trompetas vivas, piano montuno y congas', icon: '💃', image: '/images/genero-salsa.avif' },
  { id: 'salsarosa', mood: 'amor', name: 'Salsa Rosa', desc: 'Salsa romántica, suave y dedicada al amor', icon: '🌹', image: '/images/genero-salsarosa.avif' },
  { id: 'mariachi', mood: 'amor', name: 'Mariachi Tradicional', desc: 'Trompetas mexicanas, violines y guitarrón', icon: '🎺', image: '/images/genero-mariachi.avif' },
  { id: 'vallenato', mood: 'amor', name: 'Vallenato', desc: 'Acordeón, caja y guacharaca contando una historia', icon: '🪗', image: '/images/genero-vallenato.avif' },
  { id: 'carranga', mood: 'celebracion', name: 'Carranga', desc: 'Guitarra campesina, guacharaca y sabor andino', icon: '🌾', image: '/images/genero-carranga.avif' },
  { id: 'cumbia', mood: 'celebracion', name: 'Cumbia / Fiesta', desc: 'Sabor tropical, acordeón y ritmo bailable', icon: '🎉', image: '/images/genero-cumbia.avif' },

  // Populares & Románticos
  { id: 'balada', mood: 'amor', name: 'Balada Romántica', desc: 'Emotiva, piano acústico y cuerdas', icon: '❤️', image: '/images/genero-balada.avif' },
  { id: 'bolero', mood: 'amor', name: 'Bolero', desc: 'Guitarra requinto y voz nostálgica de trío', icon: '🎻', image: '/images/genero-bolero.avif' },
  { id: 'bachata', mood: 'amor', name: 'Bachata', desc: 'Guitarra dominicana romántica, íntima y bailable', icon: '🌺', image: '/images/genero-bachata.avif' },
  { id: 'pop', mood: 'celebracion', name: 'Pop Latino Moderno', desc: 'Melódico, rítmico y pegadizo', icon: '✨', image: '/images/genero-pop.avif' },
  { id: 'acustico', mood: 'amor', name: 'Acústico Íntimo', desc: 'Guitarra acústica de palo y voz cálida', icon: '🪕', image: '/images/genero-acustico.avif' },

  // Urbano & Energético
  { id: 'reggaeton', mood: 'celebracion', name: 'Reggaetón / Urbano', desc: 'Beat bailable, dembow y ritmo moderno', icon: '🔥', image: '/images/genero-urbano.avif' },
  { id: 'reggae', mood: 'celebracion', name: 'Reggae', desc: 'Ritmo relajado, bajo profundo y sabor caribeño', icon: '🌴', image: '/images/genero-reggae.avif' },
  { id: 'rock', mood: 'celebracion', name: 'Rock', desc: 'Guitarras eléctricas potentes y batería viva', icon: '🎸', image: '/images/genero-rock.avif' },
  { id: 'rap', mood: 'celebracion', name: 'Rap', desc: 'Flow rapeado, beats boom-bap y rimas con actitud', icon: '🎤', image: '/images/genero-rap.avif' },
  { id: 'lofi', mood: 'amor', name: 'Lo-Fi Chill Hop', desc: 'Relajado, nostálgico, estilo vinilo', icon: '☕', image: '/images/genero-lofi.avif' },
  { id: 'electronica', mood: 'celebracion', name: 'Electrónica / EDM', desc: 'Sintetizadores enérgicos y fiesta total', icon: '⚡', image: '/images/genero-electronica.avif' },

  // Corporativo & Navidad
  { id: 'jinglecorporativo', mood: 'celebracion', name: 'Jingle Corporativo', desc: 'Pegajoso y profesional, ideal para marcas y empresas', icon: '💼', image: '/images/genero-jinglecorporativo.avif' },
  { id: 'villancico', mood: 'celebracion', name: 'Villancico Navideño', desc: 'Cálido y festivo, para celebrar la Navidad en familia', icon: '🎄', image: '/images/genero-villancico.avif' },
];
