// "Mejorar mi idea": takes the short story a customer typed and turns it into a
// song-ready brief, adding the narrative direction that actually makes lyrics better.
//
// It deliberately does NOT add musical or production instructions — instrumentation,
// tempo, choir and ambience already come from the genre profile, and duplicating them
// here would only compete with it. What this adds is what the profile can't know:
// how to shape *this customer's details* into a verse-chorus story.
//
// The customer's own words are always kept verbatim as the opening; the direction is
// appended after them, in Spanish, so it reads naturally both to the customer in the
// textarea and to the model inside the "weave these personal details" prompt line.

import { resolveGenreProfile } from './genreProfiles.js';

const NARRATIVE_DIRECTION = {
  nana: 'Recuerda con ternura esas cosas del día, y luego ve bajando el ritmo poco a poco hasta quedar casi en un susurro: que las estrellas y la luna cuidan su sueño toda la noche, que mañana habrá más aventuras, y que en casa lo quieren muchísimo. Que la canción termine repitiendo su nombre bien suavecito, como un arrullo final.',

  infantil: 'Que la canción sea muy alegre y fácil de cantar, con frases cortas que se repitan para que pueda aprendérselas rápido. Menciona por su nombre esas cosas que le gustan, invita a saltar, aplaudir y bailar, y que en el coro se repita su nombre varias veces para que se sienta el protagonista de la canción.',

  cumpleanosInfantil: 'Que sea una canción de cumpleaños bien alegre: menciona su nombre, esas cosas que le encantan, e invita a todos los amiguitos a cantar, aplaudir y soplar las velitas. Que el coro repita su nombre para que toda la fiesta lo cante al mismo tiempo.',

  amor: 'Cuenta esto como una historia: cómo empezó todo, qué se siente estar a su lado hoy, y qué le quieres prometer o agradecer. Usa detalles concretos y momentos específicos en vez de frases generales. Que la emoción vaya creciendo hacia el final y que el coro repita su nombre con cariño, como el centro de toda la canción.',

  fiesta: 'Que la canción arranque con energía desde el primer segundo y se sienta como una fiesta de verdad. Menciona esos momentos con alegría, invita a todos a bailar, a brindar y a celebrar juntos, y que en el coro se repita su nombre bien fuerte, como cuando toda la fiesta canta al mismo tiempo.',

  urbano: 'Que las frases sean cortas, con actitud y mucho ritmo, fáciles de repetir. Convierte esos detalles en imágenes potentes en vez de explicarlos. Que el coro sea un gancho pegajoso que se quede en la cabeza y que incluya su nombre para que quede claro para quién es.',

  nostalgico: 'Que la letra sea sencilla, íntima y con pocas palabras, como un pensamiento en voz baja. Toma esos detalles y conviértelos en imágenes tranquilas y nostálgicas, sin exagerar la emoción. Que el nombre aparezca en el coro de forma suave, casi como un recuerdo.'
};

// Generic direction for free-text styles that don't resolve to a curated genre.
const DEFAULT_DIRECTION = 'Cuenta esto como una pequeña historia con principio y final: qué pasó, qué se siente, y qué le quieres decir. Usa detalles concretos en vez de frases generales, y que el coro repita su nombre para que quede claro para quién es la canción.';

const ALL_DIRECTIONS = [...Object.values(NARRATIVE_DIRECTION), DEFAULT_DIRECTION];

// Strips any direction we previously appended, so switching genre and enhancing
// again swaps the guidance instead of stacking two contradictory ones.
const stripPreviousDirection = (text) => {
  let cleaned = text;
  for (const direction of ALL_DIRECTIONS) {
    cleaned = cleaned.split(direction).join('');
  }
  return cleaned.trim();
};

export const enhanceIdea = ({ story, style }) => {
  const original = (story || '').trim();
  if (!original) return { enhanced: '', changed: false };

  const profile = resolveGenreProfile(style);
  const direction = NARRATIVE_DIRECTION[profile.narrative] || DEFAULT_DIRECTION;

  const base = stripPreviousDirection(original);
  if (!base) return { enhanced: original, changed: false };

  const separator = /[.!?…]$/.test(base) ? ' ' : '. ';
  const enhanced = `${base}${separator}${direction}`;

  return { enhanced, changed: enhanced !== original };
};
