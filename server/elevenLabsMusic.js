// Wraps the ElevenLabs /v1/music/detailed call with automatic recovery from
// "bad_prompt" rejections (copyrighted material, e.g. a customer typing an
// artist's name like "estilo Carlos Vives"). ElevenLabs returns a rewritten
// prompt_suggestion in that case — we retry once with it automatically so the
// customer still gets their song without ever seeing an error.
//
// Unlike the plain /v1/music/compose endpoint (raw audio bytes only), /detailed
// returns a multipart/mixed response with a JSON part (real lyrics + word-level
// timestamps) alongside the audio — that's what powers accurate karaoke video sync.

import { extractBoundary, parseMultipart } from './multipart.js';
import { buildLyricsLines } from './lyricsFromTimestamps.js';
import { limitTruePeak } from './audioLimiter.js';

export class ElevenLabsComposeError extends Error {
  constructor(userMessage, { status = 502, details = '' } = {}) {
    super(userMessage);
    this.name = 'ElevenLabsComposeError';
    this.status = status;
    this.userMessage = userMessage;
    this.details = details;
  }
}

// mp3_48000_320: request the highest-quality MP3 the API offers (320kbps at the
// same 48kHz sample rate we were already getting from "auto", which resolves to
// only 192kbps) — no extra credit cost, meaningfully fewer compression artifacts.
const COMPOSE_URL = 'https://api.elevenlabs.io/v1/music/detailed?output_format=mp3_48000_320';

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
      model_id: 'music_v2',
      with_timestamps: true
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

// Parses the multipart/mixed success response into { audioBuffer, lyricsLines }.
const parseDetailedResponse = async (res) => {
  const contentType = res.headers.get('content-type') || '';
  const boundary = extractBoundary(contentType);
  const buffer = Buffer.from(await res.arrayBuffer());

  if (!boundary) {
    // Unexpected shape (e.g. ElevenLabs changed the response format) — still
    // return playable audio rather than hard-failing the whole generation.
    return { audioBuffer: buffer, lyricsLines: [], songMetadata: null };
  }

  const parts = parseMultipart(buffer, boundary);
  const jsonPart = parts.find((p) => (p.headers['content-type'] || '').includes('application/json'));
  const audioPart = parts.find((p) => (p.headers['content-type'] || '').startsWith('audio/'));

  const rawAudioBuffer = audioPart ? audioPart.body : buffer;
  let lyricsLines = [];
  let songMetadata = null;

  if (jsonPart) {
    try {
      const metadata = JSON.parse(jsonPart.body.toString('utf-8'));
      const chunks = metadata?.composition_plan?.chunks || [];
      const { lines, isFullyTimed } = buildLyricsLines(chunks, metadata?.words_timestamps);
      lyricsLines = isFullyTimed ? lines : [];
      songMetadata = metadata?.song_metadata || null;
    } catch (err) {
      console.warn('[ElevenLabs] No se pudo parsear el JSON de metadata del multipart:', err.message);
    }
  }

  // Guarantee a safe true-peak ceiling regardless of how hot the AI's own master came
  // back (word timestamps stay valid — the limiter is sample-accurate, no time shift).
  let audioBuffer = rawAudioBuffer;
  try {
    audioBuffer = await limitTruePeak(rawAudioBuffer);
  } catch (err) {
    console.warn('[ElevenLabs] True-peak limiter falló, usando audio sin procesar:', err.message);
  }

  return { audioBuffer, lyricsLines, songMetadata };
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
        const { audioBuffer, lyricsLines, songMetadata } = await parseDetailedResponse(retryRes);
        return {
          audioBuffer,
          lyricsLines,
          songMetadata,
          finalPrompt: suggestion,
          wasRewritten: true,
          headerReqId: retryRes.headers.get('song-id') || retryRes.headers.get('request-id') || retryRes.headers.get('x-request-id')
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

  const { audioBuffer, lyricsLines, songMetadata } = await parseDetailedResponse(res);
  return {
    audioBuffer,
    lyricsLines,
    songMetadata,
    finalPrompt: prompt,
    wasRewritten: false,
    headerReqId: res.headers.get('song-id') || res.headers.get('request-id') || res.headers.get('x-request-id')
  };
};
