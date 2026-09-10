// Wraps the ElevenLabs /v1/music/compose call with automatic recovery from
// "bad_prompt" rejections (copyrighted material, e.g. a customer typing an
// artist's name like "estilo Carlos Vives"). ElevenLabs returns a rewritten
// prompt_suggestion in that case — we retry once with it automatically so the
// customer still gets their song without ever seeing an error.

export class ElevenLabsComposeError extends Error {
  constructor(userMessage, { status = 502, details = '' } = {}) {
    super(userMessage);
    this.name = 'ElevenLabsComposeError';
    this.status = status;
    this.userMessage = userMessage;
    this.details = details;
  }
}

const COMPOSE_URL = 'https://api.elevenlabs.io/v1/music/compose';

const requestCompose = async (apiKey, prompt, durationSec) => {
  const res = await fetch(COMPOSE_URL, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      music_length_ms: durationSec * 1000,
      model_id: 'music_v2'
    })
  });
  return res;
};

const parseErrorBody = async (res) => {
  try {
    return { json: await res.json(), text: null };
  } catch {
    return { json: null, text: await res.text() };
  }
};

// Composes a song, automatically retrying once with ElevenLabs' own suggested
// rewrite if the original prompt is rejected for mentioning copyrighted material.
export const composeMusic = async ({ apiKey, prompt, durationSec, logPrefix = '' }) => {
  let res = await requestCompose(apiKey, prompt, durationSec);

  if (!res.ok) {
    const { json, text } = await parseErrorBody(res);
    const status = json?.detail?.status;
    const suggestion = json?.detail?.data?.prompt_suggestion;

    if (status === 'bad_prompt' && suggestion) {
      console.warn(`${logPrefix}[ElevenLabs] Prompt rechazado por contenido protegido (probable nombre de artista). Reintentando con la sugerencia de ElevenLabs...`);

      const retryRes = await requestCompose(apiKey, suggestion, durationSec);

      if (retryRes.ok) {
        const arrayBuffer = await retryRes.arrayBuffer();
        return {
          audioBuffer: Buffer.from(arrayBuffer),
          finalPrompt: suggestion,
          wasRewritten: true,
          headerReqId: retryRes.headers.get('request-id') || retryRes.headers.get('x-request-id')
        };
      }

      const retryErr = await parseErrorBody(retryRes);
      console.error(`${logPrefix}[ElevenLabs] El reintento con la sugerencia también falló (${retryRes.status}):`, retryErr.json || retryErr.text);
      throw new ElevenLabsComposeError(
        'Tu descripción parece incluir el nombre de un artista o una canción protegida por derechos de autor. Por favor reformula el estilo o los detalles sin mencionar artistas específicos e inténtalo de nuevo.',
        { status: 422, details: JSON.stringify(retryErr.json || retryErr.text) }
      );
    }

    if (status === 'bad_prompt') {
      console.error(`${logPrefix}[ElevenLabs] bad_prompt sin sugerencia disponible:`, json);
      throw new ElevenLabsComposeError(
        'Tu descripción parece incluir contenido protegido por derechos de autor (por ejemplo, el nombre de un artista o canción). Por favor reformula el estilo o los detalles y vuelve a intentarlo.',
        { status: 422, details: JSON.stringify(json) }
      );
    }

    const details = json?.detail?.message || json?.message || text || JSON.stringify(json);
    console.error(`${logPrefix}[ElevenLabs] Error de API (${res.status}):`, details);
    throw new ElevenLabsComposeError(
      `Error de ElevenLabs (${res.status}): ${details}`,
      { status: res.status, details }
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  return {
    audioBuffer: Buffer.from(arrayBuffer),
    finalPrompt: prompt,
    wasRewritten: false,
    headerReqId: res.headers.get('request-id') || res.headers.get('x-request-id')
  };
};
