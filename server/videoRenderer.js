// Server-side rendering of the story-video composition into a real MP4, using
// Remotion's headless-Chromium renderer. This replaces the old client-side
// approach (capturing a <canvas> via MediaRecorder), which never actually worked
// because @remotion/player renders composited DOM layers, not a canvas — so there
// was never anything for `canvas.captureStream()` to find. Rendering server-side
// also means it works identically on any device, including phones, where
// getDisplayMedia()/MediaRecorder capture tricks aren't available at all.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENTRY_POINT = path.join(__dirname, '..', 'src', 'video', 'remotion-entry.jsx');
const COMPOSITION_ID = 'SongStoryVideo';

// Reads a video file's real duration via ffprobe — used to verify uploaded clips
// against the plan's duration budget server-side, since a client can't be trusted
// to report this honestly.
export const getVideoDurationSec = async (filePath) => {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    filePath
  ]);
  const duration = parseFloat(stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error('No se pudo leer la duración del video.');
  }
  return duration;
};

// Re-encodes an uploaded photo to AVIF, resized to comfortably cover the 720p
// output (with headroom for the Ken Burns zoom) — shrinks both the file size
// customers upload and the amount of image data the renderer has to decode
// per frame. SVT-AV1 (not the much slower libaom-av1) keeps this to ~1-2s even
// on modest hardware.
export const compressImageToAvif = async (inputPath, outputPath) => {
  await execFileAsync('ffmpeg', [
    '-y',
    '-i', inputPath,
    // force_original_aspect_ratio recomputes both dimensions from a single
    // scale factor, which can land on an odd number even if the expressions it
    // started from were pre-rounded — chaining a second scale pass to trunc to
    // even is the only way to guarantee it (yuv420p needs even width/height).
    '-vf', "scale='min(1080,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease,scale='trunc(iw/2)*2':'trunc(ih/2)*2'",
    '-c:v', 'libsvtav1',
    '-crf', '35',
    '-preset', '8',
    '-pix_fmt', 'yuv420p',
    outputPath
  ]);
};

// Re-encodes an uploaded video clip down to the actual output resolution (no
// point decoding a 4K phone video frame-by-frame during the render just to
// display it at 720p) and drops its audio entirely — the clip always plays
// muted in the composition, so there's nothing to gain from keeping it.
export const compressVideo = async (inputPath, outputPath) => {
  await execFileAsync('ffmpeg', [
    '-y',
    '-i', inputPath,
    '-vf', "scale='min(1280,iw)':'min(1280,ih)':force_original_aspect_ratio=decrease,scale='trunc(iw/2)*2':'trunc(ih/2)*2'",
    '-an',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '28',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outputPath
  ]);
};

// Bundling the composition (webpack) takes a few seconds — do it once and reuse
// the bundle for every render instead of re-bundling per request. renderMedia
// serves this directory itself over a local HTTP server, which is also why
// staged assets (below) get dropped inside it: same origin as the composition
// page, so the browser never has to make a cross-origin or file:// request
// (both of which our own security headers / Chromium block by default).
let bundleLocationPromise = null;
const getBundleLocation = () => {
  if (!bundleLocationPromise) {
    bundleLocationPromise = bundle({ entryPoint: ENTRY_POINT }).catch((err) => {
      bundleLocationPromise = null;
      throw err;
    });
  }
  return bundleLocationPromise;
};

// Pre-warms the bundle so the first customer render isn't the one paying for it.
export const preloadVideoRenderer = () => {
  getBundleLocation().catch((err) => {
    console.error('[REMOTION] Failed to pre-bundle video composition:', err.message);
  });
};

// Copies one local file into the staging folder under a fresh name and returns
// the root-relative URL to reference it by from the composition. Photos, video
// clips and the song's audio file are all real files on disk by this point
// (multer saves uploads to a temp dir before this ever runs).
const stageFile = (filePath, filename, stagingDir) => {
  fs.copyFileSync(filePath, path.join(stagingDir, filename));
  return `/${filename}`;
};

export const renderStoryVideo = async ({
  mediaItems,
  audioFilePath,
  title,
  subtitle,
  lyrics,
  lyricsLines,
  durationInFrames,
  fps,
  outputPath,
  onProgress
}) => {
  const bundleLocation = await getBundleLocation();

  const jobId = crypto.randomBytes(6).toString('hex');
  const stagingDir = path.join(bundleLocation, `tmp-assets-${jobId}`);
  fs.mkdirSync(stagingDir, { recursive: true });

  try {
    // `mediaItems` already carries the customer's chosen playback order —
    // staging just moves each file into place and converts seconds to frames.
    const stagedMediaItems = mediaItems.map((item, i) => {
      const ext = path.extname(item.filePath) || (item.type === 'video' ? '.mp4' : '.jpg');
      const url = stageFile(item.filePath, `media-${i}${ext}`, stagingDir);
      const src = `/tmp-assets-${jobId}${url}`;

      if (item.type === 'video') {
        const trimBeforeFrames = Math.round((item.trimBeforeSec || 0) * fps);
        return {
          type: 'video',
          src,
          durationFrames: Math.round(item.durationSec * fps),
          trimBeforeFrames,
          trimAfterFrames: trimBeforeFrames + Math.round(item.durationSec * fps)
        };
      }
      return {
        type: 'photo',
        src,
        durationFrames: Math.round(item.durationSec * fps)
      };
    });

    const audioExt = path.extname(audioFilePath) || '.mp3';
    const audioFilename = `audio${audioExt}`;
    fs.copyFileSync(audioFilePath, path.join(stagingDir, audioFilename));

    const inputProps = {
      mediaItems: stagedMediaItems,
      audioUrl: `/tmp-assets-${jobId}/${audioFilename}`,
      title,
      subtitle,
      lyrics,
      lyricsLines,
      isExporting: false,
      durationInFrames,
      fps
    };

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: COMPOSITION_ID,
      inputProps
    });

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      onProgress: onProgress
        ? ({ progress }) => onProgress(progress)
        : undefined
    });

    return outputPath;
  } finally {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
};
