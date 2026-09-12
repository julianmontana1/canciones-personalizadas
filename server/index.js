import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import os from 'os';
import { buildMusicPrompt } from './genreProfiles.js';
import { composeMusic, ElevenLabsComposeError } from './elevenLabsMusic.js';
import { containsOffensiveLanguage } from './contentFilter.js';
import { enhanceIdea } from './ideaEnhancer.js';
import { hashPassword, verifyPassword, generateRandomPassword } from './auth.js';
import { PLANS, DEFAULT_PLAN } from './plans.js';
import multer from 'multer';
import { renderStoryVideo, preloadVideoRenderer, getVideoDurationSec, compressImageToAvif, compressVideo } from './videoRenderer.js';
import { startBackupScheduler } from './backupScheduler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Paths
const DATA_DIR = path.join(__dirname, 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const CODES_FILE = path.join(DATA_DIR, 'codes.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const PLAN_OVERRIDES_FILE = path.join(DATA_DIR, 'planOverrides.json');
const STORAGE_DIR = path.join(__dirname, 'storage', 'songs');

// Ensure directories and files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });
if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, '[]', 'utf-8');
if (!fs.existsSync(PLAN_OVERRIDES_FILE)) fs.writeFileSync(PLAN_OVERRIDES_FILE, '{}', 'utf-8');

// Default initial codes if not exists
if (!fs.existsSync(CODES_FILE)) {
  const defaultCodes = [
    { code: 'TEST-1SONG-7A9B', plan: 'solo', maxSongs: 1, used: 0, label: 'Plan Solo · 1 Canción', createdAt: new Date().toISOString() },
    { code: 'DEMO-PACK3-9F2C', plan: 'trio', maxSongs: 3, used: 0, label: 'Pack 3 Canciones', createdAt: new Date().toISOString() },
    { code: 'DEMO-PACK5-7R1L', plan: 'quinteto', maxSongs: 5, used: 0, label: 'Pack 5 Canciones', createdAt: new Date().toISOString() },
    { code: 'MASTER-UNLIMITED-PRO', plan: 'custom', maxSongs: -1, used: 0, label: 'Superadmin Personal Ilimitado', createdAt: new Date().toISOString() }
  ];
  fs.writeFileSync(CODES_FILE, JSON.stringify(defaultCodes, null, 2), 'utf-8');
}

// Default settings if not exists. No hardcoded default password: a fresh install
// generates a random one and prints it once so it's never a publicly-known value
// baked into the repo (a real backdoor an earlier version of this file had).
if (!fs.existsSync(SETTINGS_FILE)) {
  const initialPassword = process.env.ADMIN_PASSWORD || generateRandomPassword();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
    elevenlabsApiKey: process.env.ELEVENLABS_API_KEY || '',
    adminPasswordHash: hashPassword(initialPassword)
  }, null, 2), 'utf-8');
  console.log('◆ Contraseña de Superadmin generada para este servidor:', initialPassword);
  console.log('◆ Guárdala ahora — no se volverá a mostrar. Cámbiala luego desde el panel de Configuración.');
} else {
  // Migration: an earlier version stored the admin password in plain text as
  // `adminPassword` (and used the public default "admin123"). Rotate it to a fresh
  // random password, hashed, the first time this runs against an old settings file.
  const existingSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
  if (!existingSettings.adminPasswordHash) {
    const rotatedPassword = generateRandomPassword();
    existingSettings.adminPasswordHash = hashPassword(rotatedPassword);
    delete existingSettings.adminPassword;
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(existingSettings, null, 2), 'utf-8');
    console.log('◆ Se detectó una contraseña de Superadmin antigua en texto plano y fue rotada.');
    console.log('◆ Nueva contraseña de Superadmin:', rotatedPassword);
    console.log('◆ Guárdala ahora — no se volverá a mostrar. Cámbiala luego desde el panel de Configuración.');
  }
}

// Helper: JSON read/write
const readJSON = (file, fallback = []) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) {
    console.error(`Error reading ${file}:`, e);
    return fallback;
  }
};

const writeJSON = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Error writing ${file}:`, e);
  }
};

// Admin-editable limits per account type, layered on top of the hardcoded
// factory defaults in plans.js (see GET/POST /api/admin/plans). Only the 3 real
// sale plans are editable this way — DEFAULT_PLAN stays a pure code fallback for
// legacy/custom codes that never had a recognized `plan` field.
const EDITABLE_PLAN_KEYS = Object.keys(PLANS);
const EDITABLE_PLAN_FIELDS = ['songs', 'maxPhotos', 'maxVideoClips', 'maxVideoProjects', 'maxUploadBytes'];

const getEffectivePlans = () => {
  const overrides = readJSON(PLAN_OVERRIDES_FILE, {});
  const merged = {};
  for (const key of EDITABLE_PLAN_KEYS) {
    merged[key] = { ...PLANS[key], ...(overrides[key] || {}) };
  }
  return merged;
};

// Every other call site in this file just calls planFor(code) like before —
// this is the one place that resolves it against admin overrides instead of
// the raw factory table.
const planFor = (code) => getEffectivePlans()[code?.plan] || DEFAULT_PLAN;

// ElevenLabs' own subscription caps this account at a fixed number of
// concurrent requests (2, on the current plan) — a 3rd simultaneous request
// from ANY source (real customers generating songs at the same time, the
// admin's demo batch, etc.) gets rejected upstream with a 429, not something
// our own retry logic could recover from usefully. Every call to composeMusic()
// goes through this gate so we never send more than that many requests to
// ElevenLabs at once — extra callers simply wait their turn in-process instead
// of failing outright. Raise this only if the ElevenLabs plan's own concurrent
// request limit is raised too.
const MAX_CONCURRENT_ELEVENLABS_REQUESTS = 2;
let activeElevenLabsRequests = 0;
const elevenLabsWaitQueue = [];

const withElevenLabsSlot = async (fn) => {
  if (activeElevenLabsRequests >= MAX_CONCURRENT_ELEVENLABS_REQUESTS) {
    await new Promise((resolve) => elevenLabsWaitQueue.push(resolve));
  }
  activeElevenLabsRequests++;
  try {
    return await fn();
  } finally {
    activeElevenLabsRequests--;
    const next = elevenLabsWaitQueue.shift();
    if (next) next();
  }
};

// Middlewares
const ALLOWED_ORIGINS = [
  'https://canciones.montanadev.space',
  'http://localhost:3001',
  'http://localhost:5173'
];

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // React inline styles and gradients rely on the style attribute.
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      // blob: is needed for the video creator's photo/video previews — the
      // browser generates those itself via URL.createObjectURL() from a file
      // the user just picked, so allowing it doesn't open the door to remote
      // content the way allowing arbitrary https: sources would.
      imgSrc: ["'self'", 'data:', 'blob:', 'https://www.googletagmanager.com'],
      // Google Analytics (gtag.js), added directly in index.html, plus
      // Cloudflare's own Web Analytics beacon and bot-challenge script —
      // Cloudflare injects both into the HTML at the edge for any site proxied
      // through it (the challenge one whenever a relevant Security setting is
      // on), so neither is something our own code requests but both still need
      // to be allowed or the browser blocks them.
      //
      // Cloudflare's challenge script embeds a fresh per-request token
      // (`r: '<ray-id>'`) each time, so its exact bytes — and therefore its
      // SHA-256 hash — are different on every single page load. A fixed
      // hash-source can never allowlist that; per the CSP spec, a hash-source
      // ALSO disables 'unsafe-inline' entirely (browsers ignore 'unsafe-inline'
      // whenever any hash/nonce is present), so keeping the old gtag-only hash
      // here was actively blocking Cloudflare's own script. 'unsafe-inline' is
      // the only workable option short of Cloudflare supporting nonces for it;
      // this app has no dangerouslySetInnerHTML/innerHTML usage, so there's no
      // known injection point this normally guards.
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://www.googletagmanager.com',
        'https://static.cloudflareinsights.com'
      ],
      connectSrc: [
        "'self'",
        'https://www.google-analytics.com',
        'https://*.google-analytics.com',
        'https://*.analytics.google.com',
        'https://cloudflareinsights.com',
        'https://*.cloudflareinsights.com'
      ],
      // data: alongside blob: — Remotion's Player/renderer sometimes re-encodes
      // short or unusual audio (like the demo/simulated MP3 used when no real
      // ElevenLabs key is configured) into a data: URI internally before playback.
      mediaSrc: ["'self'", 'blob:', 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"]
    }
  }
}));
app.use(cors({ origin: ALLOWED_ORIGINS }));
// Photos/videos for /api/video/render go through multer (multipart), not this —
// so the default JSON body stays small. A little above the default 100kb for
// comfortable headroom on lyrics/text fields.
app.use(express.json({ limit: '2mb' }));

// Rate limiting — brute-force and abuse protection on the endpoints that matter most:
// admin login (password guessing), access-code lookup (code enumeration), song
// generation and video transcoding (both spend real resources per request).
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.' }
});

const codeValidateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.' }
});

const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de generación desde esta conexión. Intenta de nuevo más tarde.' }
});

const videoRenderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de video desde esta conexión. Intenta de nuevo más tarde.' }
});

const enhanceIdeaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Espera un momento antes de volver a intentarlo.' }
});

// Helper: Extract client IP
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  let ip = req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }
  return ip;
};

// Middleware to verify Superadmin
const verifyAdmin = (req, res, next) => {
  const settings = readJSON(SETTINGS_FILE, {});
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || !verifyPassword(adminKey, settings.adminPasswordHash)) {
    return res.status(401).json({ error: 'Acceso no autorizado. Clave de Superadmin inválida.' });
  }
  next();
};

// Helper: Fetch ElevenLabs subscription/credit quota
const fetchElevenLabsQuota = async (apiKey) => {
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': apiKey }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      tier: data.tier,
      used: data.character_count,
      limit: data.character_limit,
      remaining: Math.max(0, (data.character_limit || 0) - (data.character_count || 0)),
      resetAt: data.next_character_count_reset_unix
        ? new Date(data.next_character_count_reset_unix * 1000).toISOString()
        : null
    };
  } catch (e) {
    console.error('Error fetching ElevenLabs quota:', e);
    return null;
  }
};

// --- GENERAL & PUBLIC ENDPOINTS ---

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Admin verify key
app.post('/api/admin/verify', adminLoginLimiter, (req, res) => {
  const { password } = req.body;
  const settings = readJSON(SETTINGS_FILE, {});
  if (verifyPassword(password, settings.adminPasswordHash)) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
});

// Enrich the customer's short story into a song-ready brief for the chosen genre.
// Pure text shaping — no AI call, no credits spent.
app.post('/api/enhance-idea', enhanceIdeaLimiter, (req, res) => {
  const { story, style } = req.body;

  if (!story || !story.trim()) {
    return res.status(400).json({ error: 'Escribe primero tu idea para poder mejorarla.' });
  }
  if (story.length > 3000 || (style && style.length > 100)) {
    return res.status(400).json({ error: 'El texto enviado es demasiado largo.' });
  }
  if (containsOffensiveLanguage(story, style)) {
    return res.status(400).json({ error: 'Tu descripción contiene lenguaje ofensivo o inapropiado.' });
  }

  const { enhanced, changed } = enhanceIdea({ story, style });
  res.json({ enhanced, changed });
});

// Validate user access code
app.get('/api/codes/validate', codeValidateLimiter, (req, res) => {
  const codeParam = (req.query.code || '').trim().toUpperCase();
  if (!codeParam) {
    return res.status(400).json({ valid: false, error: 'Debes proporcionar un código de acceso.' });
  }

  const codes = readJSON(CODES_FILE, []);
  const found = codes.find((c) => c.code.toUpperCase() === codeParam);

  if (!found) {
    return res.status(404).json({ valid: false, error: 'Código de acceso no válido o inexistente.' });
  }

  const remaining = found.maxSongs === -1 ? 'unlimited' : Math.max(0, found.maxSongs - found.used);
  const isExhausted = found.maxSongs !== -1 && found.used >= found.maxSongs;
  const plan = planFor(found);
  // Videos are spent per account (see getActiveVideoCountForCode), so this
  // usage figure is across all of this code's songs, not any single one.
  const videosUsed = getActiveVideoCountForCode(readJSON(HISTORY_FILE, []), codeParam);

  res.json({
    valid: true,
    code: found.code,
    maxSongs: found.maxSongs,
    used: found.used,
    remaining: remaining,
    label: found.label,
    isExhausted: isExhausted,
    plan: plan.key,
    maxDurationSec: plan.maxDurationSec,
    hasVideo: plan.hasVideo,
    maxPhotos: plan.maxPhotos,
    maxVideoClips: plan.maxVideoClips,
    maxVideoProjects: plan.maxVideoProjects,
    maxUploadBytes: plan.maxUploadBytes,
    videosUsed,
    videosRemaining: Math.max(0, plan.maxVideoProjects - videosUsed)
  });
});

// Get songs created by this code
app.get('/api/codes/my-songs', (req, res) => {
  const codeParam = (req.query.code || '').trim().toUpperCase();
  if (!codeParam) {
    return res.json([]);
  }

  const history = readJSON(HISTORY_FILE, []);
  // Videos are spent per account, not per song — every song below shares this
  // same running total (see getActiveVideoCountForCode).
  const accountVideosUsed = getActiveVideoCountForCode(history, codeParam);
  // Return only sanitized songs for this code (without IPs)
  const mySongs = history
    .filter((s) => s.code && s.code.toUpperCase() === codeParam)
    .map((s) => {
      // planFor() falls back to DEFAULT_PLAN for custom/legacy codes (plan: null)
      // just like everywhere else — older records predate per-song plan
      // snapshots, so this also covers songs from before that existed.
      const currentPlan = planFor(s);
      const storedMaxPhotos = s.maxPhotos !== undefined ? s.maxPhotos : currentPlan.maxPhotos;
      // maxVideoClips used to be called maxVideos before finished videos could
      // number more than one — read either field name from older records.
      const storedMaxVideoClips = s.maxVideoClips !== undefined ? s.maxVideoClips : (s.maxVideos !== undefined ? s.maxVideos : currentPlan.maxVideoClips);
      // Records from before maxVideoProjects existed only ever supported one
      // finished video at a time — treat that as their stored value.
      const storedMaxVideoProjects = s.maxVideoProjects !== undefined ? s.maxVideoProjects : 1;
      const storedMaxUploadBytes = s.maxUploadBytes !== undefined ? s.maxUploadBytes : currentPlan.maxUploadBytes;
      // Take the larger of what was snapshotted at generation time vs. what the
      // plan currently allows — so a later bump applies immediately to
      // already-generated songs too, while a plan ever getting stricter still
      // never takes away what a song already had.
      const activeVideos = getActiveSongVideos(s);
      return {
        id: s.id,
        names: s.names,
        references: s.references,
        style: s.style,
        duration: s.duration,
        audioUrl: s.audioUrl,
        filename: s.filename,
        timestamp: s.timestamp,
        lyricsLines: s.lyricsLines || [],
        voiceGender: s.voiceGender || 'cualquiera',
        plan: s.plan || null,
        hasVideo: s.hasVideo !== undefined ? s.hasVideo : currentPlan.hasVideo,
        maxPhotos: Math.max(storedMaxPhotos, currentPlan.maxPhotos),
        maxVideoClips: Math.max(storedMaxVideoClips, currentPlan.maxVideoClips),
        maxVideoProjects: Math.max(storedMaxVideoProjects, currentPlan.maxVideoProjects),
        maxUploadBytes: Math.max(storedMaxUploadBytes, currentPlan.maxUploadBytes),
        accountVideosUsed,
        videos: activeVideos.map((v) => ({
          url: `/api/storage/videos/${v.filename}`,
          expiresAt: new Date(new Date(v.createdAt).getTime() + VIDEO_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
        }))
      };
    });

  res.json(mySongs);
});

// Serve audio files
app.get('/api/storage/songs/:filename', (req, res) => {
  const { filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(STORAGE_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Archivo de audio no encontrado' });
  }

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Accept-Ranges', 'bytes');
  res.sendFile(filePath);
});

// Story-video rendering: turns a song + photos into a real vertical MP4 using
// Remotion's headless-Chromium renderer (server/videoRenderer.js). This runs as a
// background job (renders take minutes, not seconds) that the client polls for
// progress and then downloads once finished.
//
// Unlike the audio, the finished video is NOT kept forever — it's stored for 14
// days (see the retention sweep below) so the customer has time to download it,
// then it's deleted. This is disclosed in the Terms and Privacy Policy pages.
const VIDEO_RETENTION_DAYS = 14;
const VIDEO_STORAGE_DIR = path.join(__dirname, 'storage', 'videos');
if (!fs.existsSync(VIDEO_STORAGE_DIR)) fs.mkdirSync(VIDEO_STORAGE_DIR, { recursive: true });

// A song can have several independent finished videos at once (plan-dependent —
// see maxVideoProjects). Records are stored as history[i].videos = [{filename,
// createdAt}, ...]; older records that predate this still have the single
// videoFilename/videoCreatedAt fields instead, so this reads either shape.
const getSongVideos = (record) => {
  if (Array.isArray(record.videos)) return record.videos;
  if (record.videoFilename && record.videoCreatedAt) {
    return [{ filename: record.videoFilename, createdAt: record.videoCreatedAt }];
  }
  return [];
};

const getActiveSongVideos = (record) => {
  const cutoff = Date.now() - VIDEO_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return getSongVideos(record).filter((v) => v.createdAt && new Date(v.createdAt).getTime() >= cutoff);
};

// The video-creation cap (maxVideoProjects) is spent per ACCOUNT (access code),
// not per individual song — e.g. a Quinteto customer gets 2 videos total to
// spend across however many of their songs they choose, not 2 per song.
const getActiveVideoCountForCode = (history, codeUpper) =>
  history
    .filter((r) => r.code && r.code.toUpperCase() === codeUpper)
    .reduce((sum, r) => sum + getActiveSongVideos(r).length, 0);

const videoJobs = new Map(); // jobId -> { status: 'queued'|'rendering'|'done'|'failed', progress, outputPath, error, createdAt, songFilename, videoFilename, renderParams }

// Renders run one at a time. Headless Chromium is memory-hungry and this server
// runs with limited free RAM — letting several customers' renders start in
// parallel risks swapping/crashing the whole box, so extra requests just wait
// their turn in this queue instead.
const videoRenderQueue = [];
let isRenderingVideo = false;

const processVideoQueue = () => {
  if (isRenderingVideo) return;
  const jobId = videoRenderQueue.shift();
  if (!jobId) return;
  const job = videoJobs.get(jobId);
  if (!job) {
    processVideoQueue();
    return;
  }

  isRenderingVideo = true;
  job.status = 'rendering';
  const renderStart = Date.now();
  console.log(`[VIDEO ${jobId}] Iniciando render con Remotion (canción: ${job.songFilename})...`);

  let lastLoggedPercent = -1;

  renderStoryVideo({
    ...job.renderParams,
    outputPath: job.outputPath,
    onProgress: (progress) => {
      job.progress = progress;
      const percent = Math.floor(progress * 100);
      // Every 20% instead of every tick, so this doesn't flood the log.
      if (percent >= lastLoggedPercent + 20) {
        lastLoggedPercent = percent;
        console.log(`[VIDEO ${jobId}] Render ${percent}%...`);
      }
    }
  })
    .then(() => {
      job.status = 'done';
      job.videoCreatedAt = new Date().toISOString();
      console.log(`[VIDEO ${jobId}] Completado en ${((Date.now() - renderStart) / 1000).toFixed(1)}s → ${job.videoFilename}`);

      // Add the finished video as a new slot on the song's own history record so
      // it shows up in "Mis Creaciones" / the results screen without needing
      // this job's id — a song can hold several independent videos at once.
      const history = readJSON(HISTORY_FILE, []);
      const record = history.find((s) => s.filename === job.songFilename);
      if (record) {
        const existingVideos = getSongVideos(record);
        record.videos = [...existingVideos, { filename: job.videoFilename, createdAt: job.videoCreatedAt }];
        delete record.videoFilename;
        delete record.videoCreatedAt;
        writeJSON(HISTORY_FILE, history);
      }
    })
    .catch((err) => {
      console.error(`[VIDEO ${jobId}] Falló tras ${((Date.now() - renderStart) / 1000).toFixed(1)}s:`, err);
      job.status = 'failed';
      job.error = 'No se pudo generar el video. Intenta de nuevo.';
      fs.unlink(job.outputPath, () => {});
    })
    .finally(() => {
      // The original multer-uploaded files are only needed up to this point —
      // renderStoryVideo already copied whatever it needed into its own staging dir.
      // They're deleted here regardless of outcome, per the Privacy Policy: source
      // photos/videos are used only to generate the video, never kept afterward.
      for (const p of job.uploadedFilePaths || []) {
        fs.unlink(p, () => {});
      }
      isRenderingVideo = false;
      processVideoQueue();
    });
};

// In-memory job entries are just for progress polling — clear them out after a
// few hours regardless of outcome (the video file itself lives independently in
// VIDEO_STORAGE_DIR for the full 14-day retention window, tracked via history.json).
setInterval(() => {
  const staleCutoff = Date.now() - 4 * 60 * 60 * 1000;
  for (const [jobId, job] of videoJobs.entries()) {
    if (job.createdAt < staleCutoff) {
      videoJobs.delete(jobId);
    }
  }
}, 30 * 60 * 1000);

// Retention sweep: delete generated videos older than 14 days (a song can have
// several at once — each one is checked independently) and clear the
// reference from history.json, per the Terms and Privacy Policy disclosure.
const sweepExpiredVideos = () => {
  const cutoff = Date.now() - VIDEO_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const history = readJSON(HISTORY_FILE, []);
  let anyChanged = false;
  for (const record of history) {
    const allVideos = getSongVideos(record);
    if (allVideos.length === 0) continue;

    const stillActive = [];
    let recordChanged = false;
    for (const v of allVideos) {
      if (v.createdAt && new Date(v.createdAt).getTime() < cutoff) {
        fs.unlink(path.join(VIDEO_STORAGE_DIR, v.filename), () => {});
        recordChanged = true;
      } else {
        stillActive.push(v);
      }
    }

    if (recordChanged) {
      record.videos = stillActive;
      delete record.videoFilename;
      delete record.videoCreatedAt;
      anyChanged = true;
    }
  }
  if (anyChanged) writeJSON(HISTORY_FILE, history);
};
sweepExpiredVideos();
setInterval(sweepExpiredVideos, 6 * 60 * 60 * 1000);

const VIDEO_UPLOAD_DIR = path.join(os.tmpdir(), 'serenatia-video-uploads');
if (!fs.existsSync(VIDEO_UPLOAD_DIR)) fs.mkdirSync(VIDEO_UPLOAD_DIR, { recursive: true });

// Cloudflare's own edge caps a request's total body at ~100MB (Free/Pro plans) —
// a limit we can't raise from this server's own config. multer's own limit is a
// single static value (it can't vary per plan), so this is just the outer
// ceiling across every plan — the real, plan-specific enforcement is the
// total-size check further down, once the code's actual plan is known.
const MAX_POSSIBLE_UPLOAD_BYTES = 90 * 1024 * 1024;

const videoUpload = multer({
  dest: VIDEO_UPLOAD_DIR,
  limits: { fileSize: MAX_POSSIBLE_UPLOAD_BYTES, files: 10 },
  // Trust the field name alone (the client always posts the right kind of file
  // to the right field) rather than the browser's reported MIME type — some
  // mobile browsers send inconsistent or generic types for video uploads
  // (e.g. application/octet-stream), and silently dropping those here caused a
  // confusing downstream "trim inválido" error from the file/trim count no
  // longer matching. ffprobe and the compression step below are the real
  // validation gate and give a specific error if a file genuinely isn't decodable.
  fileFilter: (req, file, cb) => {
    cb(null, file.fieldname === 'photos' || file.fieldname === 'videos');
  }
});

const cleanupUploadedFiles = (req) => {
  const all = [...(req.files?.photos || []), ...(req.files?.videos || [])];
  for (const f of all) {
    fs.unlink(f.path, () => {});
  }
};

app.post(
  '/api/video/render',
  videoRenderLimiter,
  (req, res, next) => {
    videoUpload.fields([{ name: 'photos', maxCount: 5 }, { name: 'videos', maxCount: 5 }])(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'Uno de los archivos es demasiado grande (máx. 90MB combinados entre todos).' });
        }
        return res.status(400).json({ error: 'No se pudo procesar los archivos enviados.' });
      }
      next();
    });
  },
  async (req, res) => {
    const { code, filename, title, subtitle } = req.body || {};
    const photoFiles = req.files?.photos || [];
    const videoFiles = req.files?.videos || [];

    console.log(`[VIDEO] Solicitud recibida — canción: ${filename}, código: ${(code || '').toString().toUpperCase()}, ${photoFiles.length} foto(s), ${videoFiles.length} video(s)`);

    let lyrics = [];
    let lyricsLines = null;
    let photoDurationsSec = null;
    let videoTrims = null;
    let mediaOrder = null;
    try {
      lyrics = req.body.lyrics ? JSON.parse(req.body.lyrics) : [];
      lyricsLines = req.body.lyricsLines ? JSON.parse(req.body.lyricsLines) : null;
      photoDurationsSec = req.body.photoDurationsSec ? JSON.parse(req.body.photoDurationsSec) : null;
      videoTrims = req.body.videoTrims ? JSON.parse(req.body.videoTrims) : null;
      mediaOrder = req.body.mediaOrder ? JSON.parse(req.body.mediaOrder) : null;
    } catch {
      cleanupUploadedFiles(req);
      return res.status(400).json({ error: 'Datos de la solicitud inválidos.' });
    }

    const codeParam = (code || '').toString().trim().toUpperCase();
    if (!codeParam) {
      cleanupUploadedFiles(req);
      return res.status(401).json({ error: 'Se requiere un código de acceso válido.' });
    }
    const codes = readJSON(CODES_FILE, []);
    const matchedCode = codes.find((c) => c.code.toUpperCase() === codeParam);
    if (!matchedCode) {
      cleanupUploadedFiles(req);
      return res.status(401).json({ error: 'Código de acceso no válido.' });
    }
    const plan = planFor(matchedCode);
    if (!plan.hasVideo) {
      cleanupUploadedFiles(req);
      return res.status(403).json({ error: 'Tu plan no incluye la creación de video. Mejora tu plan para acceder a esta función.' });
    }

    // The song must genuinely belong to this code — otherwise any valid code could
    // render a video off of someone else's audio just by guessing a filename.
    const safeFilename = path.basename((filename || '').toString());
    const history = readJSON(HISTORY_FILE, []);
    const songRecord = history.find((s) => s.code && s.code.toUpperCase() === codeParam && s.filename === safeFilename);
    if (!songRecord) {
      cleanupUploadedFiles(req);
      return res.status(404).json({ error: 'No se encontró esa canción para tu código.' });
    }
    const audioFilePath = path.join(STORAGE_DIR, safeFilename);
    if (!fs.existsSync(audioFilePath)) {
      cleanupUploadedFiles(req);
      return res.status(404).json({ error: 'El archivo de audio de esta canción ya no existe.' });
    }

    // The video-creation cap is spent per ACCOUNT, not per song — a customer can
    // create up to plan.maxVideoProjects videos total, on whichever of their
    // songs they choose, not that many on every individual song.
    const activeVideoCount = getActiveVideoCountForCode(history, codeParam);
    if (activeVideoCount >= plan.maxVideoProjects) {
      cleanupUploadedFiles(req);
      return res.status(403).json({
        error: `Tu plan permite crear hasta ${plan.maxVideoProjects} video(s) en total para tu cuenta, y ya has creado ${activeVideoCount}. Espera a que uno expire (14 días) para crear otro.`
      });
    }

    if (photoFiles.length === 0 && videoFiles.length === 0) {
      cleanupUploadedFiles(req);
      return res.status(400).json({ error: 'Debes incluir al menos una foto o un video.' });
    }
    if (photoFiles.length > plan.maxPhotos) {
      cleanupUploadedFiles(req);
      return res.status(403).json({ error: `Tu plan permite hasta ${plan.maxPhotos} foto(s) en el video.` });
    }
    if (videoFiles.length > plan.maxVideoClips) {
      cleanupUploadedFiles(req);
      return res.status(403).json({ error: `Tu plan permite hasta ${plan.maxVideoClips} video(s) subido(s) como clip.` });
    }

    // Even if every individual file is under multer's outer cap, Cloudflare's
    // own edge still caps the whole request around 100MB — check the combined
    // total against the CODE'S OWN plan budget (not a flat global one).
    const totalUploadBytes = [...photoFiles, ...videoFiles].reduce((sum, f) => sum + f.size, 0);
    if (totalUploadBytes > plan.maxUploadBytes) {
      cleanupUploadedFiles(req);
      return res.status(413).json({
        error: `El total de fotos y videos (${(totalUploadBytes / (1024 * 1024)).toFixed(0)}MB) supera el límite de tu plan (${(plan.maxUploadBytes / (1024 * 1024)).toFixed(0)}MB combinados). Reduce el tamaño o la cantidad de archivos.`
      });
    }

    const allowedDurationSec = Math.max(1, Math.min(songRecord.duration, plan.maxDurationSec));

    // Every photo needs an explicit duration now that the customer arranges the
    // whole timeline themselves — there's no more "split the leftover time"
    // fallback once photos and videos can be freely interleaved.
    if (photoFiles.length > 0) {
      const valid =
        Array.isArray(photoDurationsSec) &&
        photoDurationsSec.length === photoFiles.length &&
        photoDurationsSec.every((d) => typeof d === 'number' && d > 0 && d <= 60);
      if (!valid) {
        cleanupUploadedFiles(req);
        return res.status(400).json({ error: 'Las duraciones de las fotos no son válidas.' });
      }
    }

    // Verify each uploaded clip's real duration server-side (never trust the
    // client for this) and make sure the total doesn't exceed the song itself.
    let videoDurations = [];
    try {
      videoDurations = await Promise.all(videoFiles.map((f) => getVideoDurationSec(f.path)));
    } catch (err) {
      cleanupUploadedFiles(req);
      return res.status(400).json({ error: 'No se pudo leer uno de los videos subidos.' });
    }

    // Optional per-clip trim (which part of the uploaded video to actually use,
    // like WhatsApp's share-video trimmer) — {start, end} in seconds, relative to
    // the original file. Falls back to the full clip when not provided.
    //
    // The browser's own read of a video's duration (what the trim UI is built
    // against) and ffprobe's can legitimately disagree by more than a trivial
    // rounding error — phone-recorded clips (.MOV/HEVC especially) are a common
    // case. Rather than reject a trim that only slightly overruns the real
    // duration, clamp it to what ffprobe actually measured.
    const MIN_CLIP_SEC = 1;
    let videoTrimSecs;
    if (videoTrims !== null) {
      if (Array.isArray(videoTrims) && videoTrims.length !== videoFiles.length) {
        cleanupUploadedFiles(req);
        return res.status(400).json({ error: 'No se recibieron todos los videos que subiste. Intenta subirlos de nuevo.' });
      }
      const structurallyValid =
        Array.isArray(videoTrims) &&
        videoTrims.length === videoFiles.length &&
        videoTrims.every((t) => t && typeof t.start === 'number' && typeof t.end === 'number' && t.end > t.start);
      if (!structurallyValid) {
        cleanupUploadedFiles(req);
        return res.status(400).json({ error: 'El recorte de uno de los videos no es válido.' });
      }
      videoTrimSecs = videoTrims.map((t, i) => {
        const realDuration = videoDurations[i];
        const start = Math.max(0, Math.min(t.start, Math.max(0, realDuration - MIN_CLIP_SEC)));
        const end = Math.max(start + MIN_CLIP_SEC, Math.min(t.end, realDuration));
        return { start, effectiveDuration: end - start };
      });
    } else {
      videoTrimSecs = videoDurations.map((d) => ({ start: 0, effectiveDuration: d }));
    }

    const totalVideoDuration = videoTrimSecs.reduce((sum, t) => sum + t.effectiveDuration, 0);
    if (totalVideoDuration > allowedDurationSec) {
      cleanupUploadedFiles(req);
      return res.status(400).json({
        error: `La suma de tus videos (${Math.round(totalVideoDuration)}s) no puede superar la duración de la canción (${allowedDurationSec}s).`
      });
    }

    // The customer's chosen playback order — a permutation of every uploaded
    // photo and video, e.g. [{type:'video',fileIndex:0}, {type:'photo',fileIndex:0}, ...].
    // Falls back to "videos first, then photos" (the old fixed behavior) if the
    // client doesn't send one.
    const totalItems = photoFiles.length + videoFiles.length;
    if (mediaOrder !== null) {
      const seenPhotos = new Set();
      const seenVideos = new Set();
      const valid =
        Array.isArray(mediaOrder) &&
        mediaOrder.length === totalItems &&
        mediaOrder.every((m) => {
          if (!m || (m.type !== 'photo' && m.type !== 'video')) return false;
          const set = m.type === 'photo' ? seenPhotos : seenVideos;
          const max = m.type === 'photo' ? photoFiles.length : videoFiles.length;
          if (!Number.isInteger(m.fileIndex) || m.fileIndex < 0 || m.fileIndex >= max || set.has(m.fileIndex)) return false;
          set.add(m.fileIndex);
          return true;
        });
      if (!valid) {
        cleanupUploadedFiles(req);
        return res.status(400).json({ error: 'El orden del contenido no es válido.' });
      }
    } else {
      mediaOrder = [
        ...videoFiles.map((_, i) => ({ type: 'video', fileIndex: i })),
        ...photoFiles.map((_, i) => ({ type: 'photo', fileIndex: i }))
      ];
    }

    // Compress before staging for render: photos → AVIF, video clips → a
    // smaller h264 at the actual output resolution. This is both about upload
    // weight and render speed — a 4K phone video costs real decode time per
    // frame during the render regardless of how small the final output is.
    let compressedPhotoPaths;
    let compressedVideoPaths;
    try {
      if (photoFiles.length > 0) console.log(`[VIDEO] Comprimiendo ${photoFiles.length} foto(s) a AVIF...`);
      const photoCompressStart = Date.now();
      compressedPhotoPaths = await Promise.all(
        photoFiles.map(async (f, i) => {
          const compressedPath = path.join(VIDEO_UPLOAD_DIR, `compressed-${crypto.randomBytes(4).toString('hex')}.avif`);
          await compressImageToAvif(f.path, compressedPath);
          console.log(`[VIDEO]   foto ${i + 1}/${photoFiles.length} comprimida`);
          return compressedPath;
        })
      );
      if (photoFiles.length > 0) console.log(`[VIDEO] Fotos comprimidas en ${((Date.now() - photoCompressStart) / 1000).toFixed(1)}s`);

      if (videoFiles.length > 0) console.log(`[VIDEO] Comprimiendo ${videoFiles.length} clip(s) de video...`);
      const videoCompressStart = Date.now();
      compressedVideoPaths = await Promise.all(
        videoFiles.map(async (f, i) => {
          const compressedPath = path.join(VIDEO_UPLOAD_DIR, `compressed-${crypto.randomBytes(4).toString('hex')}.mp4`);
          await compressVideo(f.path, compressedPath);
          console.log(`[VIDEO]   clip ${i + 1}/${videoFiles.length} comprimido`);
          return compressedPath;
        })
      );
      if (videoFiles.length > 0) console.log(`[VIDEO] Clips comprimidos en ${((Date.now() - videoCompressStart) / 1000).toFixed(1)}s`);
    } catch (err) {
      console.error('[VIDEO RENDER] Compression failed:', err);
      cleanupUploadedFiles(req);
      return res.status(500).json({ error: 'No se pudieron procesar las fotos o videos subidos.' });
    }

    const mediaItems = mediaOrder.map((m) =>
      m.type === 'photo'
        ? { type: 'photo', filePath: compressedPhotoPaths[m.fileIndex], durationSec: photoDurationsSec[m.fileIndex] }
        : {
            type: 'video',
            filePath: compressedVideoPaths[m.fileIndex],
            durationSec: videoTrimSecs[m.fileIndex].effectiveDuration,
            trimBeforeSec: videoTrimSecs[m.fileIndex].start
          }
    );

    const cleanTitle = (title || '').toString().slice(0, 150);
    const cleanSubtitle = (subtitle || '').toString().slice(0, 150);
    const cleanLyrics = Array.isArray(lyrics) ? lyrics.slice(0, 60).map((l) => String(l).slice(0, 200)) : [];
    const cleanLyricsLines = Array.isArray(lyricsLines) ? lyricsLines.slice(0, 200) : null;

    const fps = 30;
    const durationInFrames = allowedDurationSec * fps;

    const uploadedFilePaths = [...photoFiles, ...videoFiles].map((f) => f.path).concat(compressedPhotoPaths, compressedVideoPaths);

    // Each render is its own slot now (a song can hold up to maxVideoProjects
    // finished videos at once) — a unique suffix per job instead of a filename
    // purely derived from the song, which used to mean "one video per song".
    const videoFilename = `${safeFilename.replace(/\.mp3$/i, '')}_${crypto.randomBytes(3).toString('hex')}.mp4`;
    const outputPath = path.join(VIDEO_STORAGE_DIR, videoFilename);

    const jobId = crypto.randomBytes(8).toString('hex');
    videoJobs.set(jobId, {
      status: 'queued',
      progress: 0,
      outputPath,
      error: null,
      createdAt: Date.now(),
      songFilename: safeFilename,
      videoFilename,
      uploadedFilePaths,
      renderParams: {
        mediaItems,
        audioFilePath,
        title: cleanTitle,
        subtitle: cleanSubtitle,
        lyrics: cleanLyrics,
        lyricsLines: cleanLyricsLines,
        durationInFrames,
        fps
      }
    });
    videoRenderQueue.push(jobId);
    console.log(`[VIDEO ${jobId}] En cola (posición ${videoRenderQueue.length}) — ${mediaItems.length} elemento(s) en el orden elegido`);

    res.json({ jobId });
    processVideoQueue();
  }
);

app.get('/api/video/render/:jobId/status', (req, res) => {
  const job = videoJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Trabajo no encontrado.' });
  }
  const videoExpiresAt = job.videoCreatedAt
    ? new Date(new Date(job.videoCreatedAt).getTime() + VIDEO_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
    : null;
  res.json({
    status: job.status,
    progress: job.progress,
    error: job.error,
    queuePosition: job.status === 'queued' ? videoRenderQueue.indexOf(req.params.jobId) + 1 : 0,
    videoUrl: job.status === 'done' ? `/api/storage/videos/${job.videoFilename}` : null,
    videoExpiresAt
  });
});

// Serve a generated video — persists for VIDEO_RETENTION_DAYS (see sweepExpiredVideos).
app.get('/api/storage/videos/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(VIDEO_STORAGE_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Video no encontrado o ya expiró.' });
  }

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Accept-Ranges', 'bytes');
  res.sendFile(filePath);
});

// Generate song endpoint
app.post('/api/generate', generateLimiter, async (req, res) => {
  const ip = getClientIp(req);
  // `simulate` is intentionally NOT read from the request body — it used to let any
  // caller bypass real generation from the public endpoint. Admin testing without
  // spending a customer's quota already has its own gated route (/api/admin/demo/generate).
  const { code, names, references, style, duration, voiceGender } = req.body;

  // 1. Verify access code
  const codeParam = (code || '').trim().toUpperCase();
  if (!codeParam) {
    return res.status(400).json({ error: 'Se requiere un código de acceso para generar canciones.' });
  }

  console.log(`[SONG] Solicitud recibida — código: ${codeParam}, estilo: ${style || '(sin especificar)'}, duración pedida: ${duration || '(default)'}s`);

  if ((names && names.length > 200) || (references && references.length > 3000) || (style && style.length > 100)) {
    return res.status(400).json({ error: 'Uno de los campos enviados es demasiado largo.' });
  }

  const codes = readJSON(CODES_FILE, []);
  const codeIndex = codes.findIndex((c) => c.code.toUpperCase() === codeParam);

  if (codeIndex === -1) {
    return res.status(403).json({ error: 'Código de acceso no válido o inexistente.' });
  }

  const userCode = codes[codeIndex];
  if (userCode.maxSongs !== -1 && userCode.used >= userCode.maxSongs) {
    return res.status(403).json({
      error: `Este código ya ha utilizado todas sus canciones permitidas (${userCode.used}/${userCode.maxSongs}). Contacta al administrador para obtener más cupo.`
    });
  }

  console.log(`[SONG] Código válido (${userCode.code}) — cupo: ${userCode.maxSongs === -1 ? 'ilimitado' : `${userCode.used}/${userCode.maxSongs}`}`);

  // 1.5 Content moderation — reject offensive language before spending any credits.
  // Doesn't count against the code's song quota since nothing was generated.
  if (containsOffensiveLanguage(names, references, style)) {
    return res.status(400).json({
      error: 'Tu descripción contiene lenguaje ofensivo o inapropiado. Por favor edítala y vuelve a intentarlo.'
    });
  }
  console.log('[SONG] Moderación de contenido: aprobado');

  // 2. Fetch server API key from settings
  const settings = readJSON(SETTINGS_FILE, {});
  const activeApiKey = (settings.elevenlabsApiKey || process.env.ELEVENLABS_API_KEY || '').trim();

  // Allow simulate mode if activeApiKey is missing or requested
  const isDemo = !activeApiKey;

  // Duration is capped by the code's plan, not a flat global max — a Plan Solo
  // code can't be pushed past 120s just by calling this endpoint directly with a
  // larger `duration`, even though the client UI already filters the options.
  const plan = planFor(userCode);
  const durationSec = Math.max(10, Math.min(parseInt(duration, 10) || 30, plan.maxDurationSec));
  const songId = 'song_' + crypto.randomBytes(6).toString('hex');
  const filename = `${songId}.mp3`;
  const filePath = path.join(STORAGE_DIR, filename);

  const songStyle = style || 'Pop acústico';
  const songNames = names || 'Para alguien especial';
  const songRefs = references || 'Celebrando momentos felices y recuerdos inolvidables';
  const VALID_VOICE_GENDERS = ['masculina', 'femenina', 'ambas'];
  const songVoiceGender = VALID_VOICE_GENDERS.includes(voiceGender) ? voiceGender : 'cualquiera';

  console.log(`[SONG] Construyendo prompt musical (estilo: ${songStyle}, ${durationSec}s, voz: ${songVoiceGender})...`);
  const prompt = buildMusicPrompt({
    style: songStyle,
    names: songNames,
    references: songRefs,
    durationSec,
    voiceGender: songVoiceGender
  });

  let elevenlabsId = `el_${crypto.randomBytes(8).toString('hex')}`;
  let audioBuffer = null;
  let lyricsLines = [];

  try {
    if (isDemo) {
      console.log(`[DEMO GENERATION] Code: ${userCode.code} | IP: ${ip}`);
      elevenlabsId = `sim_${Date.now()}`;

      // Generate synthetic playable MP3 buffer
      const demoMp3Header = Buffer.from([
        0xFF, 0xFB, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
      ]);
      const chunks = [];
      for (let i = 0; i < 2000; i++) {
        chunks.push(demoMp3Header);
      }
      audioBuffer = Buffer.concat(chunks);
    } else {
      console.log(`[ELEVENLABS API] Requesting compose for Code: ${userCode.code} | IP: ${ip}`);
      const composeResult = await withElevenLabsSlot(() => composeMusic({
        apiKey: activeApiKey,
        prompt,
        durationSec,
        logPrefix: `[Code: ${userCode.code}] `
      }));

      audioBuffer = composeResult.audioBuffer;
      lyricsLines = composeResult.lyricsLines || [];
      if (composeResult.headerReqId) {
        elevenlabsId = composeResult.headerReqId;
      }
      if (composeResult.wasRewritten) {
        console.log(`[ELEVENLABS API] Prompt reescrito automáticamente por contenido protegido para Code: ${userCode.code}`);
      }
    }

    console.log(`[SONG] Audio recibido (${lyricsLines.length} línea(s) de letra con tiempos reales) — guardando archivo...`);

    // Save audio file
    fs.writeFileSync(filePath, audioBuffer);
    const stats = fs.statSync(filePath);
    console.log(`[SONG] Archivo guardado: ${filename} (${(stats.size / 1024).toFixed(0)}KB)`);

    // Increment code usage
    userCode.used = (userCode.used || 0) + 1;
    codes[codeIndex] = userCode;
    writeJSON(CODES_FILE, codes);

    // Save record to Superadmin audit history
    const record = {
      id: songId,
      code: userCode.code,
      codeLabel: userCode.label,
      elevenlabsId: elevenlabsId,
      ip: ip,
      timestamp: new Date().toISOString(),
      names: songNames,
      references: songRefs,
      style: songStyle,
      duration: durationSec,
      filename: filename,
      fileSizeBytes: stats.size,
      audioUrl: `/api/storage/songs/${filename}`,
      prompt: prompt,
      isSimulated: isDemo,
      lyricsLines: lyricsLines,
      voiceGender: songVoiceGender,
      plan: plan.key,
      hasVideo: plan.hasVideo,
      maxPhotos: plan.maxPhotos,
      maxVideoClips: plan.maxVideoClips,
      maxVideoProjects: plan.maxVideoProjects,
      maxUploadBytes: plan.maxUploadBytes
    };

    const history = readJSON(HISTORY_FILE, []);
    history.unshift(record);
    writeJSON(HISTORY_FILE, history);

    const remainingSongs = userCode.maxSongs === -1 ? 'unlimited' : Math.max(0, userCode.maxSongs - userCode.used);

    console.log(`[SUCCESS] Song created: ${songId} (Code: ${userCode.code}, Left: ${remainingSongs})`);

    return res.json({
      success: true,
      remaining: remainingSongs,
      song: {
        id: songId,
        names: songNames,
        references: songRefs,
        style: songStyle,
        duration: durationSec,
        audioUrl: `/api/storage/songs/${filename}`,
        filename: filename,
        lyricsLines: lyricsLines,
        voiceGender: songVoiceGender,
        plan: plan.key,
        hasVideo: plan.hasVideo,
        maxPhotos: plan.maxPhotos,
        maxVideoClips: plan.maxVideoClips,
        maxVideoProjects: plan.maxVideoProjects,
        maxUploadBytes: plan.maxUploadBytes,
        accountVideosUsed: getActiveVideoCountForCode(history, codeParam),
        videos: []
      }
    });

  } catch (error) {
    if (error instanceof ElevenLabsComposeError) {
      console.error(`Fallo al componer canción (Code: ${userCode.code}):`, error.details || error.message);
      return res.status(error.status).json({ error: error.userMessage });
    }
    console.error('Unexpected error generating song:', error);
    return res.status(500).json({
      error: 'Error interno del servidor al procesar la canción: ' + error.message
    });
  }
});

// --- SUPERADMIN ENDPOINTS ---

// Get all generated songs
app.get('/api/admin/history', verifyAdmin, (req, res) => {
  const history = readJSON(HISTORY_FILE, []);
  res.json({
    total: history.length,
    songs: history
  });
});

// Delete a song record and file
app.delete('/api/admin/history/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  let history = readJSON(HISTORY_FILE, []);
  const itemIndex = history.findIndex((s) => s.id === id);

  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Registro no encontrado' });
  }

  const [removed] = history.splice(itemIndex, 1);
  writeJSON(HISTORY_FILE, history);

  if (removed.filename) {
    const filePath = path.join(STORAGE_DIR, removed.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting song file:', err);
      }
    }
  }

  res.json({ success: true, message: 'Canción y archivo eliminados correctamente' });
});

// Get settings
app.get('/api/admin/settings', verifyAdmin, (req, res) => {
  const settings = readJSON(SETTINGS_FILE, {});
  const rawKey = settings.elevenlabsApiKey || '';
  const maskedKey = rawKey ? `${rawKey.slice(0, 6)}...${rawKey.slice(-4)}` : '';

  res.json({
    hasKey: Boolean(rawKey),
    maskedKey: maskedKey,
    hasPassword: Boolean(settings.adminPasswordHash)
  });
});

// Update settings
app.post('/api/admin/settings', verifyAdmin, (req, res) => {
  const { elevenlabsApiKey, newAdminPassword } = req.body;
  const settings = readJSON(SETTINGS_FILE, {});

  if (elevenlabsApiKey !== undefined) {
    settings.elevenlabsApiKey = elevenlabsApiKey.trim();
  }
  if (newAdminPassword && newAdminPassword.trim().length >= 8) {
    settings.adminPasswordHash = hashPassword(newAdminPassword.trim());
  } else if (newAdminPassword) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
  }

  writeJSON(SETTINGS_FILE, settings);
  res.json({ success: true, message: 'Configuración actualizada correctamente' });
});

// Get all codes
app.get('/api/admin/codes', verifyAdmin, (req, res) => {
  const codes = readJSON(CODES_FILE, []);
  res.json(codes);
});

// Create or update a code
app.post('/api/admin/codes', verifyAdmin, (req, res) => {
  const { code, maxSongs, label, plan } = req.body;
  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'El código no puede estar vacío.' });
  }

  const cleanCode = code.trim().toUpperCase();
  const codes = readJSON(CODES_FILE, []);
  const existing = codes.find((c) => c.code === cleanCode);

  if (existing) {
    return res.status(400).json({ error: 'Ya existe un código con ese identificador.' });
  }

  // A recognized plan (solo/trio/quinteto) owns the song count — it's what the
  // customer actually paid for. "Personalizado" (no plan, or an unrecognized one)
  // keeps the old free-form behavior for admin/legacy codes. Uses the admin's
  // current effective plans (factory defaults + any overrides), so a new code
  // gets whatever the plan grants right now, not a stale hardcoded number.
  const effectivePlans = getEffectivePlans();
  const cleanPlan = effectivePlans[plan] ? plan : null;
  const newCodeObj = {
    code: cleanCode,
    plan: cleanPlan,
    maxSongs: cleanPlan
      ? effectivePlans[cleanPlan].songs
      : (parseInt(maxSongs, 10) === -1 ? -1 : (parseInt(maxSongs, 10) || 1)),
    used: 0,
    label: label?.trim() || (cleanPlan ? effectivePlans[cleanPlan].label : `Código ${cleanCode}`),
    createdAt: new Date().toISOString()
  };

  codes.unshift(newCodeObj);
  writeJSON(CODES_FILE, codes);

  res.json({ success: true, code: newCodeObj });
});

// Delete a code
app.delete('/api/admin/codes/:code', verifyAdmin, (req, res) => {
  const codeParam = req.params.code.trim().toUpperCase();
  let codes = readJSON(CODES_FILE, []);
  const filtered = codes.filter((c) => c.code !== codeParam);

  if (filtered.length === codes.length) {
    return res.status(404).json({ error: 'Código no encontrado' });
  }

  writeJSON(CODES_FILE, filtered);
  res.json({ success: true, message: 'Código eliminado exitosamente' });
});

// Read the current per-plan limits (factory defaults merged with any admin overrides)
app.get('/api/admin/plans', verifyAdmin, (req, res) => {
  res.json({
    plans: getEffectivePlans(),
    factoryDefaults: PLANS,
    overrides: readJSON(PLAN_OVERRIDES_FILE, {})
  });
});

// Update (or reset) the limits for one account type — songs, max photos, max
// uploaded video clips, max videos that can be created, and the combined
// upload budget. Every code on that plan picks up the new limits immediately,
// and songs already generated never lose what they were originally granted
// (see the Math.max() "never take away" pattern in /api/codes/my-songs).
app.post('/api/admin/plans', verifyAdmin, (req, res) => {
  const { planKey, patch, reset } = req.body || {};
  if (!EDITABLE_PLAN_KEYS.includes(planKey)) {
    return res.status(400).json({ error: 'Tipo de cuenta no válido.' });
  }

  const overrides = readJSON(PLAN_OVERRIDES_FILE, {});

  if (reset) {
    delete overrides[planKey];
    writeJSON(PLAN_OVERRIDES_FILE, overrides);
    return res.json({ success: true, plans: getEffectivePlans() });
  }

  if (!patch || typeof patch !== 'object') {
    return res.status(400).json({ error: 'Faltan los valores a actualizar.' });
  }

  const cleanPatch = {};
  for (const field of EDITABLE_PLAN_FIELDS) {
    if (patch[field] === undefined) continue;
    const value = Number(patch[field]);
    if (!Number.isFinite(value) || value < 0) {
      return res.status(400).json({ error: `El valor de "${field}" no es válido.` });
    }
    cleanPatch[field] = Math.round(value);
  }

  overrides[planKey] = { ...(overrides[planKey] || {}), ...cleanPatch };
  writeJSON(PLAN_OVERRIDES_FILE, overrides);

  res.json({ success: true, plans: getEffectivePlans() });
});

// Get live ElevenLabs credit quota
app.get('/api/admin/quota', verifyAdmin, async (req, res) => {
  const settings = readJSON(SETTINGS_FILE, {});
  const activeApiKey = (settings.elevenlabsApiKey || process.env.ELEVENLABS_API_KEY || '').trim();

  if (!activeApiKey) {
    return res.status(400).json({ error: 'No hay una API Key de ElevenLabs configurada.' });
  }

  const quota = await fetchElevenLabsQuota(activeApiKey);
  if (!quota) {
    return res.status(502).json({ error: 'No se pudo consultar la cuota en ElevenLabs. Verifica la API Key.' });
  }

  res.json(quota);
});

// Generate a demo song (Superadmin only, does not consume access codes)
app.post('/api/admin/demo/generate', verifyAdmin, async (req, res) => {
  const { demoId, names, references, style, duration } = req.body;

  const settings = readJSON(SETTINGS_FILE, {});
  const activeApiKey = (settings.elevenlabsApiKey || process.env.ELEVENLABS_API_KEY || '').trim();

  if (!activeApiKey) {
    return res.status(400).json({ error: 'No hay una API Key de ElevenLabs configurada. Configúrala en la pestaña de Configuración.' });
  }

  const durationSec = Math.max(10, Math.min(parseInt(duration, 10) || 30, 300));
  const songId = 'demo_' + crypto.randomBytes(6).toString('hex');
  const filename = `${songId}.mp3`;
  const filePath = path.join(STORAGE_DIR, filename);

  const songStyle = style || 'Pop acústico';
  const songNames = names || 'Demo';
  const songRefs = references || '';

  const prompt = buildMusicPrompt({
    style: songStyle,
    names: songNames,
    references: songRefs,
    durationSec
  });

  try {
    const quotaBefore = await fetchElevenLabsQuota(activeApiKey);

    console.log(`[ADMIN DEMO] Generating demo "${demoId}" | Style: ${songStyle} | Duration: ${durationSec}s`);
    const composeResult = await withElevenLabsSlot(() => composeMusic({
      apiKey: activeApiKey,
      prompt,
      durationSec,
      logPrefix: `[Demo: ${demoId}] `
    }));

    const audioBuffer = composeResult.audioBuffer;
    const elevenlabsId = composeResult.headerReqId || `el_${crypto.randomBytes(8).toString('hex')}`;
    if (composeResult.wasRewritten) {
      console.log(`[ADMIN DEMO] Prompt reescrito automáticamente por contenido protegido para demo: ${demoId}`);
    }

    fs.writeFileSync(filePath, audioBuffer);
    const stats = fs.statSync(filePath);

    const quotaAfter = await fetchElevenLabsQuota(activeApiKey);
    const creditsUsed = (quotaBefore && quotaAfter) ? Math.max(0, quotaAfter.used - quotaBefore.used) : null;

    const record = {
      id: songId,
      code: 'DEMO',
      codeLabel: `Demo Superadmin (${demoId || 'sin-id'})`,
      elevenlabsId: elevenlabsId,
      ip: getClientIp(req),
      timestamp: new Date().toISOString(),
      names: songNames,
      references: songRefs,
      style: songStyle,
      duration: durationSec,
      filename: filename,
      fileSizeBytes: stats.size,
      audioUrl: `/api/storage/songs/${filename}`,
      prompt: prompt,
      isSimulated: false,
      isDemo: true,
      demoId: demoId || null,
      creditsUsed: creditsUsed,
      lyricsLines: composeResult.lyricsLines || []
    };

    const history = readJSON(HISTORY_FILE, []);
    history.unshift(record);
    writeJSON(HISTORY_FILE, history);

    console.log(`[ADMIN DEMO SUCCESS] Song: ${songId} | Credits used: ${creditsUsed ?? 'desconocido'}`);

    return res.json({
      success: true,
      song: record,
      creditsUsed,
      quotaBefore,
      quotaAfter
    });
  } catch (error) {
    if (error instanceof ElevenLabsComposeError) {
      console.error(`Fallo al componer demo "${demoId}":`, error.details || error.message);
      return res.status(error.status).json({ error: error.userMessage });
    }
    console.error('Unexpected error generating demo song:', error);
    return res.status(500).json({
      error: 'Error interno del servidor al procesar la canción demo: ' + error.message
    });
  }
});

// Public: list showcase demo songs for the landing page
const PUBLIC_DEMO_ORDER = ['demo-a-pedida-novia', 'demo-b-nana-martina', 'demo-c-cumple-papa'];

app.get('/api/demos', (req, res) => {
  const history = readJSON(HISTORY_FILE, []);
  const demoRecords = history.filter((s) => s.isDemo && s.demoId);

  const latestByDemoId = {};
  demoRecords.forEach((s) => {
    const existing = latestByDemoId[s.demoId];
    if (!existing || new Date(s.timestamp) > new Date(existing.timestamp)) {
      latestByDemoId[s.demoId] = s;
    }
  });

  const ordered = PUBLIC_DEMO_ORDER
    .map((id) => latestByDemoId[id])
    .filter(Boolean)
    .map((s) => ({
      demoId: s.demoId,
      names: s.names,
      references: s.references,
      style: s.style,
      duration: s.duration,
      audioUrl: s.audioUrl
    }));

  res.json(ordered);
});

// Public: real generated demo audio + the story that produced it, for the
// "Explora Estilos" gallery's own "Escuchar demo" button and its "Ver guía de
// creación" companion — keyed by genre id, separate from the 3-item curated
// PUBLIC_DEMO_ORDER above. The client falls back to a generic instrument-only
// preview (and hides the guide) for any genre that doesn't have a generated
// demo yet.
app.get('/api/genre-demos', (req, res) => {
  const history = readJSON(HISTORY_FILE, []);
  const demoRecords = history.filter((s) => s.isDemo && s.demoId);

  const latestByDemoId = {};
  demoRecords.forEach((s) => {
    const existing = latestByDemoId[s.demoId];
    if (!existing || new Date(s.timestamp) > new Date(existing.timestamp)) {
      latestByDemoId[s.demoId] = s;
    }
  });

  const genreDemos = {};
  Object.values(latestByDemoId).forEach((s) => {
    genreDemos[s.demoId] = {
      audioUrl: s.audioUrl,
      names: s.names,
      references: s.references,
      style: s.style,
      duration: s.duration
    };
  });

  res.json(genreDemos);
});

// Turns body-parser errors (oversized/malformed JSON) into a JSON response instead
// of Express's default HTML error page, which broke the client's `res.json()` call.
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La solicitud es demasiado grande.' });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'La solicitud tiene un formato inválido.' });
  }
  next(err);
});

// Serve frontend static files if dist folder exists (production / Docker mode)
const DIST_DIR = path.join(__dirname, '../dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get(/(.*)/, (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Canciones Personalizadas escuchando en http://localhost:${PORT}`);
  console.log(`📁 Almacén de audio: ${STORAGE_DIR}`);
  preloadVideoRenderer();
  startBackupScheduler();
});
