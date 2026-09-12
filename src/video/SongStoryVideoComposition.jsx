import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig
} from 'remotion';

export const SongStoryVideoComposition = ({
  // A single, ordered timeline the customer arranges themselves — each entry is
  // either a photo or a video clip, in whatever order they dragged them into.
  // Shape: { type: 'photo', src, durationFrames } | { type: 'video', src,
  // durationFrames, trimBeforeFrames, trimAfterFrames }. If it doesn't fill the
  // whole song, the entire sequence loops back to its first item — not just the
  // photos — until the song ends.
  mediaItems = [],
  audioUrl = '',
  title = 'Para Camila con amor',
  subtitle = 'Balada Romántica · Canción Oficial',
  lyrics = [],
  lyricsLines = null,
  isExporting = false
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps, width } = useVideoConfig();
  // Everything below is authored in absolute pixels against a 1080x1920 canvas.
  // Rather than rewrite every value for each output resolution, the whole thing
  // renders at that reference size and scales down (or up) to fit whatever the
  // actual composition width is — 720p today, 1080p in the live preview.
  const REFERENCE_WIDTH = 1080;
  const REFERENCE_HEIGHT = 1920;
  const designScale = width / REFERENCE_WIDTH;
  const currentMs = (frame / fps) * 1000;

  const validItems = mediaItems.filter((it) => it && it.src && it.durationFrames > 0);
  const totalCycleFrames = validItems.reduce((sum, it) => sum + it.durationFrames, 0);
  const frameInCycle = totalCycleFrames > 0 ? frame % totalCycleFrames : 0;

  let currentIndex = 0;
  let cumulativeFrames = 0;
  for (let i = 0; i < validItems.length; i++) {
    if (frameInCycle < cumulativeFrames + validItems[i].durationFrames) {
      currentIndex = i;
      break;
    }
    cumulativeFrames += validItems[i].durationFrames;
  }
  const currentItem = validItems[currentIndex];
  const itemDuration = currentItem?.durationFrames || 30;
  const frameInItem = frameInCycle - cumulativeFrames;

  // How many times the whole sequence needs to repeat to fill the song — video
  // items need one <Sequence> per repetition (they carry their own internal
  // clock), unlike photos, which are just conditionally shown based on the
  // computed `currentItem` above.
  const repeatCount = totalCycleFrames > 0 ? Math.ceil(durationInFrames / totalCycleFrames) : 1;

  // Ken Burns zoom effect: slow zoom from 1.0 to 1.12 (photos only)
  const currentZoom = interpolate(
    frameInItem,
    [0, itemDuration],
    [1.0, 1.12],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Each item's start offset within a single cycle — used to place every
  // repetition's video <Sequence>s at the right absolute frame.
  const itemStartInCycle = [];
  {
    let running = 0;
    for (const it of validItems) {
      itemStartInCycle.push(running);
      running += it.durationFrames;
    }
  }

  // =========================================================================
  // CLEAN KARAOKE LYRICS (ONE SHORT PHRASE AT A TIME, NO PROMPTS / NO CLUTTER)
  // =========================================================================
  // Two modes:
  //  - Real timing: `lyricsLines` holds the song's ACTUAL lyrics with real
  //    per-word millisecond timestamps from ElevenLabs — used whenever available.
  //  - Estimated: no real timing data (older songs, or user-edited text) — falls
  //    back to spreading `lyrics` evenly across an assumed singing window.
  const hasRealTiming = Array.isArray(lyricsLines) && lyricsLines.length > 0;

  let currentLineRaw = '';
  let currentWords = [];
  let activeWordIndex = -1;
  let frameInLine = 0;

  if (hasRealTiming) {
    const HOLD_MS = 700; // keep the last line's words lit briefly after it ends
    let activeLine = null;

    for (let i = lyricsLines.length - 1; i >= 0; i--) {
      const line = lyricsLines[i];
      if (line.startMs != null && currentMs >= line.startMs) {
        const lineEnd = line.endMs ?? line.startMs;
        if (currentMs <= lineEnd + HOLD_MS) activeLine = line;
        break;
      }
    }

    if (activeLine) {
      currentLineRaw = activeLine.text;
      currentWords = activeLine.words.map((w) => w.word);

      const liveIdx = activeLine.words.findIndex(
        (w) => w.startMs != null && w.endMs != null && currentMs >= w.startMs && currentMs < w.endMs
      );
      if (liveIdx !== -1) {
        activeWordIndex = liveIdx;
      } else {
        // Between words, or in the post-line hold window: count words already sung.
        activeWordIndex = activeLine.words.filter((w) => w.endMs != null && currentMs >= w.endMs).length;
      }

      frameInLine = Math.max(0, Math.floor(((currentMs - activeLine.startMs) / 1000) * fps));
    }
  } else {
    const validLyrics = Array.isArray(lyrics) && lyrics.length > 0
      ? lyrics.map((l) => (typeof l === 'string' ? l : l.text || '')).filter(Boolean)
      : [
          'Hoy brilla el sol en tu mirada',
          'Cada momento a tu lado es especial',
          'Esta melodía fue escrita para ti',
          'Un regalo de amor que dura para siempre'
        ];

    const totalLines = validLyrics.length;

    // Assume a 10% musical intro and 5% outro to better sync with AI songs
    const startFrame = Math.floor(durationInFrames * 0.10);
    const endFrame = Math.floor(durationInFrames * 0.95);
    const singingDuration = endFrame - startFrame;

    const framesPerLine = Math.max(45, Math.floor(singingDuration / totalLines));

    if (frame >= startFrame && frame <= endFrame) {
      const frameInSinging = frame - startFrame;
      const currentLineIndex = Math.min(totalLines - 1, Math.floor(frameInSinging / framesPerLine));
      frameInLine = frameInSinging % framesPerLine;
      const lineProgress = Math.min(1, Math.max(0, frameInLine / framesPerLine));
      currentLineRaw = validLyrics[currentLineIndex] || '';
      currentWords = currentLineRaw.split(' ').filter(Boolean);
      activeWordIndex = Math.floor(lineProgress * currentWords.length);
    }
  }

  // Smooth entrance
  const lineScale = interpolate(frameInLine, [0, 8], [0.92, 1], {
    extrapolateRight: 'clamp'
  });
  const lineOpacity = interpolate(frameInLine, [0, 6], [0, 1], {
    extrapolateRight: 'clamp'
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#070913' }}>
    <div
      style={{
        position: 'relative',
        width: REFERENCE_WIDTH,
        height: REFERENCE_HEIGHT,
        // AbsoluteFill (the parent here) is a flex column container by default —
        // without flexShrink:0 this div gets shrunk to fit it *before* the scale
        // transform below ever applies, squashing the whole design upward.
        flexShrink: 0,
        transform: `scale(${designScale})`,
        transformOrigin: 'top left',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* 1. The customer's own ordered timeline of photos + video clips, looping
          as a whole (not just the photos) if it doesn't fill the whole song. */}
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        {/* Current photo, with Ken Burns zoom — only rendered while a photo is
            the active item; videos take over this frame window via the
            <Sequence>s below instead. */}
        {currentItem?.type === 'photo' && (
          <Img
            src={currentItem.src}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${currentZoom})`,
              transition: 'transform 0.1s linear'
            }}
          />
        )}

        {/* Every video item needs its own <Sequence> per repetition of the
            cycle, since OffthreadVideo tracks its own internal clock off the
            absolute frame — a single element can't represent it looping. */}
        {Array.from({ length: repeatCount }).map((_, rep) =>
          validItems.map((item, i) => {
            if (item.type !== 'video') return null;
            const absoluteStart = rep * totalCycleFrames + itemStartInCycle[i];
            if (absoluteStart >= durationInFrames) return null;
            const clippedDuration = Math.min(item.durationFrames, durationInFrames - absoluteStart);
            return (
              <Sequence key={`${rep}-${i}`} from={absoluteStart} durationInFrames={clippedDuration}>
                <OffthreadVideo
                  src={item.src}
                  muted
                  trimBefore={item.trimBeforeFrames || 0}
                  trimAfter={item.trimAfterFrames}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Sequence>
            );
          })
        )}
      </AbsoluteFill>

      {/* 2. Soft Vignette: dark on top and bottom, clean in the middle */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(180deg, rgba(7, 9, 19, 0.6) 0%, rgba(7, 9, 19, 0.1) 35%, rgba(7, 9, 19, 0.45) 65%, rgba(7, 9, 19, 0.92) 100%)',
          pointerEvents: 'none'
        }}
      />

      {/* Brand Badge on Top */}
      <div
        style={{
          position: 'absolute',
          top: 65,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            padding: '10px 24px',
            borderRadius: 9999,
            backgroundColor: 'rgba(10, 14, 28, 0.8)',
            border: '1.5px solid rgba(244, 114, 182, 0.35)',
            backdropFilter: 'blur(16px)',
            color: '#ffffff',
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}
        >
          <span style={{ fontSize: 20 }}>✨</span>
          <span>SerenatIA</span>
          <span style={{ fontSize: 16, color: '#f472b6', fontWeight: 600 }}>• Canción Original</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CLEAN, ELEGANT KARAOKE SUBTITLES (NO UGLY BOXES, NO LONG PROMPTS)       */}
      {/* ========================================================================= */}
      {currentLineRaw && (
        <div
          style={{
            position: 'absolute',
            bottom: 340,
            left: 50,
            right: 50,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <div
            style={{
              padding: '20px 36px',
              maxWidth: 960,
              textAlign: 'center',
              transform: `scale(${lineScale})`,
              opacity: lineOpacity,
              transition: 'transform 0.1s ease-out'
            }}
          >
            {/* Active Line with Word-by-Word Karaoke Highlight */}
            <div
              style={{
                fontSize: 40,
                fontWeight: 800,
                lineHeight: 1.35,
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 12
              }}
            >
              {currentWords.map((word, wIdx) => {
                const isPast = wIdx < activeWordIndex;
                const isCurrent = wIdx === activeWordIndex;

                let wordColor = 'rgba(255, 255, 255, 0.6)';
                let wordShadow = '0 2px 8px rgba(0,0,0,0.8)';
                let wordTransform = 'scale(1)';
                let wordWeight = 700;

                if (isPast) {
                  wordColor = '#facc15'; // Bright Gold
                  wordShadow = '0 0 16px rgba(250, 204, 21, 0.8), 0 0 30px rgba(236, 72, 153, 0.5)';
                  wordWeight = 900;
                } else if (isCurrent) {
                  wordColor = '#ffffff';
                  wordShadow = '0 0 20px #f472b6, 0 0 40px #ec4899, 0 0 60px #a855f7';
                  wordWeight = 900;
                  wordTransform = 'translateY(-6px) scale(1.18)';
                }

                return (
                  <span
                    key={wIdx}
                    style={{
                      color: wordColor,
                      textShadow: wordShadow,
                      transform: wordTransform,
                      fontWeight: wordWeight,
                      display: 'inline-block',
                      transition: 'all 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BOTTOM GLASSMORPHISM PILL (WITH PLENTY OF CLEARANCE ABOVE CONTROLS)     */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          bottom: 140, // High enough to avoid overlapping with any player controls
          left: 50,
          right: 50
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(15, 19, 36, 0.92)',
            backdropFilter: 'blur(24px)',
            border: '2px solid rgba(244, 114, 182, 0.4)',
            borderRadius: 32,
            padding: '22px 30px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 35px rgba(236, 72, 153, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20
          }}
        >
          {/* Left: Play button + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, minWidth: 0, flex: 1 }}>
            
            {/* Play Button Icon */}
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: 24,
                background: 'linear-gradient(135deg, #d946ef 0%, #ec4899 50%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(236, 72, 153, 0.55)',
                flexShrink: 0
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>

            {/* Title & Subtitle */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3
                  style={{
                    color: '#ffffff',
                    fontSize: 28,
                    fontWeight: 800,
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {title}
                </h3>
                <span style={{ fontSize: 22, color: '#f472b6' }}>✨</span>
              </div>
              <p
                style={{
                  color: '#94a3b8',
                  fontSize: 19,
                  margin: '4px 0 0 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {subtitle}
              </p>
            </div>

          </div>

          {/* Right: Dynamic Animated Soundwave Equalizer */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 42, paddingRight: 6 }}>
            {[
              { color: '#ec4899', speed: 5, offset: 1 },
              { color: '#c084fc', speed: 4, offset: 2.5 },
              { color: '#f472b6', speed: 5.5, offset: 4 },
              { color: '#38bdf8', speed: 4.8, offset: 1.8 },
              { color: '#ec4899', speed: 6, offset: 3 }
            ].map((bar, i) => {
              const animatedHeight = (Math.sin(frame / bar.speed + bar.offset) + 1) * 16 + 8;
              return (
                <div
                  key={i}
                  style={{
                    width: 7,
                    height: animatedHeight,
                    backgroundColor: bar.color,
                    borderRadius: 9999,
                    boxShadow: `0 0 10px ${bar.color}80`
                  }}
                />
              );
            })}
          </div>

        </div>
      </div>

      {/* Audio sync */}
      {audioUrl && !isExporting && <Audio src={audioUrl} />}

    </div>
    </AbsoluteFill>
  );
};
