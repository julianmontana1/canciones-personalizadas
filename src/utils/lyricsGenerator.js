/**
 * Generates authentic, rhythmic Spanish song lyrics (versos y coro)
 * based on user dedication, memories, and musical style.
 * Eliminates prompt artifacts like "Quiero una canción..." and produces
 * clean, poetic phrases (4-8 words per line) ideal for 9:16 video karaoke.
 */

export function generateSongLyrics({ names = '', references = '', style = 'Balada' }) {
  const cleanDedication = (names || '')
    .replace(/^(para|de parte de|con amor para|dedicada a|cancion para)\s+/i, '')
    .trim() || 'Alguien especial';

  const rawRefs = (references || '')
    .replace(/(quiero una canci[oó]n|me gustar[ií]a|por favor|que diga que|que hable de|es una canci[oó]n|dedicada a)/gi, '')
    .replace(/[«»"']/g, '')
    .trim();

  // Extract keywords / phrases
  const ideas = rawRefs
    .split(/[.,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  const styleLower = (style || '').toLowerCase();
  const isKids = styleLower.includes('infantil') || styleLower.includes('nana') || styleLower.includes('dormir') || styleLower.includes('ronda');
  const isLove = styleLower.includes('balada') || styleLower.includes('rom[aá]ntic') || styleLower.includes('bolero') || styleLower.includes('ac[uú]stico');
  const isParty = styleLower.includes('salsa') || styleLower.includes('banda') || styleLower.includes('cumbia') || styleLower.includes('urbano') || styleLower.includes('reggaeton');

  const lines = [];

  if (isKids) {
    // Versos alegres infantiles o nana
    lines.push(`Hoy brilla el sol para ${cleanDedication}`);
    if (ideas[0]) lines.push(cleanIdea(ideas[0], 'Con risas y juegos en el jardín'));
    else lines.push('Con risas, juegos y diversión');

    if (ideas[1]) lines.push(cleanIdea(ideas[1], 'Corriendo feliz sin parar'));
    else lines.push('Bailando y soñando despierto');

    lines.push(`Siempre a tu lado, dulce ${cleanDedication}`);
    
    if (ideas[2]) lines.push(cleanIdea(ideas[2], 'Tus papás te cuidan con devoción'));
    else lines.push('Tu alegría ilumina el hogar');

    if (ideas[3]) lines.push(cleanIdea(ideas[3], 'Juegos y risas de corazón'));
    else lines.push('Un pedacito de cielo y felicidad');

    lines.push(`Para ti con amor, ${cleanDedication}`);
    lines.push('Esta canción es para verte sonreír');

  } else if (isLove) {
    // Balada romántica o emotiva
    lines.push(`Desde el primer día junto a ti`);
    lines.push(`Eres mi luz, mi dulce ${cleanDedication}`);
    
    if (ideas[0]) lines.push(cleanIdea(ideas[0], 'Cada momento a tu lado es mágico'));
    else lines.push('Tu mirada me llena el corazón');

    if (ideas[1]) lines.push(cleanIdea(ideas[1], 'Un camino que elegimos compartir'));
    else lines.push('Gracias por cada instante de amor');

    lines.push(`Por siempre tú y yo, ${cleanDedication}`);

    if (ideas[2]) lines.push(cleanIdea(ideas[2], 'Nuestra historia no tiene final'));
    else lines.push('Juntos en las buenas y en las malas');

    lines.push('Esta canción guarda todo lo que siento');
    lines.push(`Te amo con el alma, ${cleanDedication}`);

  } else if (isParty) {
    // Regional, Salsa, Fiesta, Urbano
    lines.push(`¡Que empiece la fiesta por ${cleanDedication}!`);
    lines.push('Con todo el ritmo y el corazón');

    if (ideas[0]) lines.push(cleanIdea(ideas[0], 'Celebrando la vida y la alegría'));
    else lines.push('Brindemos por los buenos momentos');

    if (ideas[1]) lines.push(cleanIdea(ideas[1], 'Que la música no pare de sonar'));
    else lines.push('Un festejo que nadie va a olvidar');

    lines.push(`¡Un fuerte abrazo para ${cleanDedication}!`);
    
    if (ideas[2]) lines.push(cleanIdea(ideas[2], 'Gozando juntos hasta el final'));
    else lines.push('Salud, amor y bendiciones');

    lines.push('Que suene la música y viva el amor');

  } else {
    // General personalizada
    lines.push(`Para alguien único en este mundo`);
    lines.push(`Dedicado para ti, ${cleanDedication}`);
    
    if (ideas[0]) lines.push(cleanIdea(ideas[0], 'Cada recuerdo es un tesoro'));
    else lines.push('Tus momentos felices son eternos');

    if (ideas[1]) lines.push(cleanIdea(ideas[1], 'Una historia escrita con cariño'));
    else lines.push('Gracias por ser tan especial');

    lines.push(`Siempre presente, ${cleanDedication}`);

    if (ideas[2]) lines.push(cleanIdea(ideas[2], 'Un lazo que nunca se romperá'));
    else lines.push('Deseándote lo mejor hoy y siempre');

    lines.push('Esta canción es tu regalo de amor');
  }

  return lines.filter(Boolean);
}

// Helper to make an idea sound like a song verse
function cleanIdea(idea, fallback) {
  let text = idea.trim();
  if (text.length > 55) {
    text = text.slice(0, 50).replace(/\s+\S*$/, '...');
  }
  // Capitalize first letter
  return text.charAt(0).toUpperCase() + text.slice(1);
}
