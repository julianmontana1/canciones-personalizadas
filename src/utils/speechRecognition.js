// Voice Dictation and intelligent parsing using Web Speech API

export const isSpeechRecognitionSupported = () => {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
};

export const createSpeechRecognizer = ({ onResult, onError, onEnd }) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (onError) onError('El reconocimiento de voz no está soportado en este navegador.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'es-ES';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let fullTranscript = '';
    for (let i = 0; i < event.results.length; i++) {
      fullTranscript += event.results[i][0].transcript + ' ';
    }
    if (onResult) {
      onResult(fullTranscript.trim());
    }
  };

  recognition.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
};

// Natural language parser to auto-extract fields from spoken audio
export const parseSpokenSongPrompt = (text) => {
  const lower = text.toLowerCase();
  const result = {
    names: '',
    references: text,
    style: '',
    duration: 60
  };

  // 1. Detect genre (including kids, lullaby, salsa, mariachi, banda)
  const genrePatterns = [
    // Order matters: more specific phrases are checked before the generic
    // patterns they could otherwise be swallowed by (e.g. "ronda" before
    // "infantil", "reggaetón" before "reggae", "bolero" before "balada").
    { key: 'Rondas Infantiles', match: ['ronda infantil', 'rondas infantiles', 'ronda', 'rondas', 'juego de niños', 'canción de juego'] },
    { key: 'Fiesta Infantil', match: ['fiesta infantil', 'infantil', 'niño', 'niña', 'niños', 'hijo', 'hija', 'juego', 'jugar', 'chiquito'] },
    { key: 'Canción de Dormir / Nana', match: ['dormir', 'nana', 'arrullo', 'bebé', 'bebe', 'sueño', 'caja de música', 'lullaby'] },
    { key: 'Vallenato', match: ['vallenato', 'caja vallenata', 'guacharaca', 'provinciano', 'parrandero'] },
    { key: 'Salsa Rosa', match: ['salsa rosa', 'salsa romántica', 'salsa romantica', 'salsa lenta'] },
    { key: 'Bachata', match: ['bachata', 'dominicana', 'dominicano'] },
    { key: 'Salsa Brava / Caribeña', match: ['salsa', 'salsa brava', 'caribeña', 'timba', 'congas', 'guaguancó'] },
    { key: 'Mariachi Tradicional', match: ['mariachi', 'ranchera', 'mexicano', 'mexicana', 'ranchero', 'serenata'] },
    { key: 'Banda Sinaloense', match: ['banda', 'banda sinaloense', 'tambora', 'corrido', 'norteño', 'norteña'] },
    { key: 'Carranga', match: ['carranga', 'carranguera', 'carranguero', 'campesina', 'campesino', 'tiple'] },
    { key: 'Cumbia / Fiesta', match: ['cumbia', 'fiesta', 'tropical', 'bailable', 'acordeón'] },
    { key: 'Bolero', match: ['bolero', 'trío romántico', 'trio romantico', 'requinto'] },
    { key: 'Balada Romántica', match: ['balada', 'romántica', 'romantica', 'amor', 'aniversario', 'enamorado'] },
    { key: 'Reggaetón / Urbano', match: ['reggaeton', 'reggaetón', 'urbano', 'perreo', 'dembow', 'trap'] },
    { key: 'Reggae', match: ['reggae', 'jamaiquino', 'ragga'] },
    { key: 'Rap', match: ['rap', 'hip hop', 'hiphop', 'freestyle'] },
    { key: 'Pop Latino Moderno', match: ['pop', 'pop latino', 'pegadiza'] },
    { key: 'Rock', match: ['rock', 'guitarras', 'rock and roll'] },
    { key: 'Acústico Íntimo', match: ['acústico', 'acustico', 'guitarra acústica', 'guitarra acustica'] },
    { key: 'Lo-Fi Chill Hop', match: ['lofi', 'lo-fi', 'chill', 'relajante', 'suave'] },
    { key: 'Electrónica / EDM', match: ['electrónica', 'electronica', 'edm', 'dance', 'techno'] }
  ];

  for (const g of genrePatterns) {
    if (g.match.some((keyword) => lower.includes(keyword))) {
      result.style = g.key;
      break;
    }
  }

  // 2. Detect duration
  if (lower.includes('30 segundos') || lower.includes('treinta segundos')) {
    result.duration = 30;
  } else if (lower.includes('90 segundos') || lower.includes('minuto y medio')) {
    result.duration = 90;
  } else if (lower.includes('2 minutos') || lower.includes('dos minutos') || lower.includes('120 segundos')) {
    result.duration = 120;
  } else if (lower.includes('3 minutos') || lower.includes('tres minutos') || lower.includes('180 segundos')) {
    result.duration = 180;
  } else if (lower.includes('1 minuto') || lower.includes('un minuto') || lower.includes('60 segundos')) {
    result.duration = 60;
  }

  // 3. Detect recipient / name
  const namePatterns = [
    /(?:para|dedicada a|dedicado a|sobre|homenaje a|canción para)\s+([a-záéíóúñ\s]+?)(?:,|que|en su|por su|quien|donde|\.|$)/i,
    /(?:se llama|el nombre es)\s+([a-záéíóúñ\s]+?)(?:,|que|\.|$)/i
  ];

  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim();
      if (extracted.length > 2 && extracted.length < 50) {
        result.names = extracted.replace(/\b\w/g, (l) => l.toUpperCase());
        break;
      }
    }
  }

  return result;
};
