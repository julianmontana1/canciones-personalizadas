// Safety net against distorted-sounding vocals: guarantees every generated song lands
// at a consistent, safe loudness and true-peak ceiling, regardless of how hot (or how
// quiet) the AI's own internal mastering came back. Prompt wording nudges the model
// toward gentler dynamics (see genreProfiles.js) but can't guarantee it — this does,
// deterministically, via ffmpeg's loudnorm filter (EBU R128, true-peak aware).
//
// Also fixes a real inconsistency: without this, different genres came back anywhere
// from -16.4 to -10.9 LUFS, so songs sounded noticeably louder/quieter back to back.
//
// -14 LUFS matches common streaming-platform normalization targets. -1.5 dBTP (rather
// than -1.0) leaves margin for the MP3 re-encode itself to slightly overshoot the
// sample-domain peak, and for lossy re-encodes further downstream (e.g. the video
// exporter's WebM->MP4/AAC transcode).

import { spawn } from 'child_process';

const TARGET_I = -14;
const TARGET_TP = -1.5;
const TARGET_LRA = 11;

export const limitTruePeak = (inputBuffer) =>
  new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-i', 'pipe:0',
      '-af', `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}`,
      '-codec:a', 'libmp3lame',
      '-b:a', '320k',
      '-ar', '48000',
      '-f', 'mp3',
      'pipe:1'
    ]);

    const chunks = [];
    let stderr = '';

    ffmpeg.stdout.on('data', (chunk) => chunks.push(chunk));
    ffmpeg.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    ffmpeg.on('error', reject);
    ffmpeg.on('close', (code) => {
      if (code !== 0 || chunks.length === 0) {
        reject(new Error(`ffmpeg loudness normalization failed (code ${code}): ${stderr.slice(-500)}`));
        return;
      }
      resolve(Buffer.concat(chunks));
    });

    ffmpeg.stdin.write(inputBuffer);
    ffmpeg.stdin.end();
  });
