import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig
} from 'remotion';

export const SongStoryVideoComposition = ({
  photos = [],
  audioUrl = '',
  title = 'Para Camila con amor',
  subtitle = 'Balada Romántica · Canción Oficial',
  lyrics = [],
  lyricsLines = null,
  isExporting = false
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const currentMs = (frame / fps) * 1000;

  // Ensure at least one fallback image if none provided
  const validPhotos = photos.length > 0 ? photos : ['/images/hero-vocalista.avif'];
  const photoCount = validPhotos.length;
  const framesPerPhoto = Math.max(30, Math.floor(durationInFrames / photoCount));

  // Determine current active photo and next photo for smooth crossfade
  const currentPhotoIndex = Math.min(
    photoCount - 1,
    Math.floor(frame / framesPerPhoto)
  );
  const nextPhotoIndex = (currentPhotoIndex + 1) % photoCount;

  // Frame offset within the current photo's duration
  const frameInPhoto = frame % framesPerPhoto;

  // Crossfade transition in the last 20 frames of each photo
  const transitionFrames = 20;
  const isTransitioning = frameInPhoto >= framesPerPhoto - transitionFrames && photoCount > 1;
  const crossfadeOpacity = isTransitioning
    ? interpolate(
        frameInPhoto,
        [framesPerPhoto - transitionFrames, framesPerPhoto],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : 0;

  // Ken Burns zoom effect: slow zoom from 1.0 to 1.12
  const currentZoom = interpolate(
    frameInPhoto,
    [0, framesPerPhoto],
    [1.0, 1.12],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const nextZoom = 1.0;

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
    <AbsoluteFill style={{ backgroundColor: '#070913', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* 1. Background Photo Slideshow with Ken Burns & Crossfade */}
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        {/* Current Photo */}
        <Img
          src={validPhotos[currentPhotoIndex]}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${currentZoom})`,
            transition: 'transform 0.1s linear'
          }}
        />

        {/* Next Photo crossfading in */}
        {isTransitioning && (
          <Img
            src={validPhotos[nextPhotoIndex]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: crossfadeOpacity,
              transform: `scale(${nextZoom})`
            }}
          />
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

    </AbsoluteFill>
  );
};
