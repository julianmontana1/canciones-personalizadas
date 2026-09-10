// Turns ElevenLabs' detailed-compose response (composition_plan chunk text +
// words_timestamps) into karaoke-ready lines with real per-word timing, instead of
// guessing at how lyrics map onto the audio.

const SECTION_LINE_RE = /^\s*\[[^\]]*\]\s*$/; // e.g. "[Verse 1]"
const DIRECTION_ONLY_RE = /^\s*\{[^}]*\}\s*$/; // e.g. "{guitar solo}"

const tokenizeWords = (line) =>
  line
    .replace(/\{[^}]*\}/g, ' ') // strip inline directions like {scratching}
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);

// `chunks`: composition_plan.chunks from the API response (each has a `text` field
// that may contain section markers, lyric lines and inline directions).
// `wordsTimestamps`: the flat words_timestamps array from the same response,
// in the same order the words are actually sung across the whole song.
export const buildLyricsLines = (chunks, wordsTimestamps) => {
  const fullText = (Array.isArray(chunks) ? chunks : [])
    .map((c) => c.text || '')
    .join('\n');

  const sungLines = fullText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !SECTION_LINE_RE.test(l) && !DIRECTION_ONLY_RE.test(l));

  const timestamps = Array.isArray(wordsTimestamps) ? wordsTimestamps : [];
  let cursor = 0;

  const lines = sungLines.map((text) => {
    const words = tokenizeWords(text);
    const slice = timestamps.slice(cursor, cursor + words.length);
    cursor += words.length;

    const timedWords = words.map((word, i) => ({
      word,
      startMs: slice[i] ? slice[i].start_ms : null,
      endMs: slice[i] ? slice[i].end_ms : null
    }));

    const timed = timedWords.filter((w) => w.startMs != null);
    return {
      text,
      words: timedWords,
      startMs: timed.length ? timed[0].startMs : null,
      endMs: timed.length ? timed[timed.length - 1].endMs : null
    };
  });

  // Only trust this as "real timing" if every line actually got matched — a partial
  // mismatch (tokenization drift, filler sounds not in the text, etc.) would produce
  // a confusing half-synced result, so callers should fall back entirely in that case.
  const isFullyTimed = lines.length > 0 && lines.every((l) => l.startMs != null && l.endMs != null);

  return { lines, isFullyTimed };
};
