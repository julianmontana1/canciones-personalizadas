import { registerRoot, Composition } from 'remotion';
import React from 'react';
import { SongStoryVideoComposition } from './SongStoryVideoComposition';

// Entry point used only by the server-side renderer (@remotion/bundler +
// @remotion/renderer). The live in-browser preview in SongVideoCreatorModal.jsx
// uses @remotion/player directly against SongStoryVideoComposition and never
// touches this file — this only exists so the composition can be bundled and
// rendered to a real MP4 outside the browser.
const RemotionRoot = () => (
  <Composition
    id="SongStoryVideo"
    component={SongStoryVideoComposition}
    durationInFrames={900}
    fps={30}
    // 720p for now — cuts render weight/time meaningfully vs 1080p while still
    // looking sharp on a phone screen (WhatsApp/Reels/TikTok all recompress
    // anyway). The composition itself is still authored at 1080x1920 and scales
    // down to fit whatever resolution is set here.
    width={720}
    height={1280}
    defaultProps={{
      mediaItems: [],
      audioUrl: '',
      title: '',
      subtitle: '',
      lyrics: [],
      lyricsLines: null,
      isExporting: false
    }}
    calculateMetadata={({ props }) => ({
      durationInFrames: props.durationInFrames || 900,
      fps: props.fps || 30
    })}
  />
);

registerRoot(RemotionRoot);
