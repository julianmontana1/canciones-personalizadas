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
import { execFile } from 'child_process';
import { buildMusicPrompt } from './genreProfiles.js';
import { composeMusic, ElevenLabsComposeError } from './elevenLabsMusic.js';
import { containsOffensiveLanguage } from './contentFilter.js';
import { hashPassword, verifyPassword, generateRandomPassword } from './auth.js';

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
const STORAGE_DIR = path.join(__dirname, 'storage', 'songs');

// Ensure directories and files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });
if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, '[]', 'utf-8');

// Default initial codes if not exists
if (!fs.existsSync(CODES_FILE)) {
  const defaultCodes = [
    { code: 'TEST-1SONG-7A9B', maxSongs: 1, used: 0, label: 'Prueba 1 Canción', createdAt: new Date().toISOString() },
    { code: 'VIP-5SONGS-K3M8', maxSongs: 5, used: 0, label: 'Paquete VIP 5 Canciones', createdAt: new Date().toISOString() },
    { code: 'MASTER-UNLIMITED-PRO', maxSongs: -1, used: 0, label: 'Superadmin Personal Ilimitado', createdAt: new Date().toISOString() }
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
      imgSrc: ["'self'", 'data:', 'https://www.googletagmanager.com'],
      // Google Analytics (gtag.js), added directly in index.html.
      // The exact SHA-256 hash below allowlists only the inline gtag() init
      // snippet in index.html — if that snippet's content ever changes, this
      // hash must be regenerated (the browser console reports the new one).
      scriptSrc: ["'self'", 'https://www.googletagmanager.com', "'sha256-gk/8XBYnqy71IAfKgGs5mpj3ERha9FKTniimGXMlFXM='"],
      connectSrc: ["'self'", 'https://www.google-analytics.com', 'https://*.google-analytics.com', 'https://*.analytics.google.com'],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"]
    }
  }
}));
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

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

const videoTranscodeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de video desde esta conexión. Intenta de nuevo más tarde.' }
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

  res.json({
    valid: true,
    code: found.code,
    maxSongs: found.maxSongs,
    used: found.used,
    remaining: remaining,
    label: found.label,
    isExhausted: isExhausted
  });
});

// Get songs created by this code
app.get('/api/codes/my-songs', (req, res) => {
  const codeParam = (req.query.code || '').trim().toUpperCase();
  if (!codeParam) {
    return res.json([]);
  }

  const history = readJSON(HISTORY_FILE, []);
  // Return only sanitized songs for this code (without IPs)
  const mySongs = history
    .filter((s) => s.code && s.code.toUpperCase() === codeParam)
    .map((s) => ({
      id: s.id,
      names: s.names,
      references: s.references,
      style: s.style,
      duration: s.duration,
      audioUrl: s.audioUrl,
      filename: s.filename,
      timestamp: s.timestamp,
      lyricsLines: s.lyricsLines || [],
      voiceGender: s.voiceGender || 'cualquiera'
    }));

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

// Transcode a browser-recorded video (WebM, from canvas + MediaRecorder capture) into
// a real, widely-compatible MP4 (H.264/AAC). Browsers' MediaRecorder can't reliably
// produce MP4 directly across Chrome/Firefox, so the client always records WebM and
// this endpoint converts it server-side with ffmpeg before the user downloads it.
const VIDEO_TMP_DIR = path.join(os.tmpdir(), 'serenatia-video-export');
if (!fs.existsSync(VIDEO_TMP_DIR)) fs.mkdirSync(VIDEO_TMP_DIR, { recursive: true });

app.post('/api/video/transcode', videoTranscodeLimiter, express.raw({ type: 'video/webm', limit: '60mb' }), (req, res) => {
  // Require a real access code so this CPU-heavy endpoint isn't wide open to anyone
  // on the internet — doesn't need remaining song quota, just proof of being a real user.
  const codeParam = (req.query.code || '').toString().trim().toUpperCase();
  if (!codeParam) {
    return res.status(401).json({ error: 'Se requiere un código de acceso válido.' });
  }
  const codes = readJSON(CODES_FILE, []);
  if (!codes.some((c) => c.code.toUpperCase() === codeParam)) {
    return res.status(401).json({ error: 'Código de acceso no válido.' });
  }

  if (!req.body || !req.body.length) {
    return res.status(400).json({ error: 'No se recibió ningún video para convertir.' });
  }

  const jobId = crypto.randomBytes(6).toString('hex');
  const inputPath = path.join(VIDEO_TMP_DIR, `${jobId}.webm`);
  const outputPath = path.join(VIDEO_TMP_DIR, `${jobId}.mp4`);

  fs.writeFileSync(inputPath, req.body);

  execFile(
    'ffmpeg',
    [
      '-y',
      '-i', inputPath,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-movflags', '+faststart',
      outputPath
    ],
    { maxBuffer: 1024 * 1024 * 20 },
    (err, _stdout, stderr) => {
      fs.unlink(inputPath, () => {});

      if (err) {
        console.error('[VIDEO TRANSCODE] ffmpeg error:', stderr || err.message);
        return res.status(500).json({ error: 'No se pudo convertir el video a MP4.' });
      }

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
      const stream = fs.createReadStream(outputPath);
      stream.pipe(res);
      stream.on('close', () => fs.unlink(outputPath, () => {}));
      stream.on('error', () => fs.unlink(outputPath, () => {}));
    }
  );
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

  // 1.5 Content moderation — reject offensive language before spending any credits.
  // Doesn't count against the code's song quota since nothing was generated.
  if (containsOffensiveLanguage(names, references, style)) {
    return res.status(400).json({
      error: 'Tu descripción contiene lenguaje ofensivo o inapropiado. Por favor edítala y vuelve a intentarlo.'
    });
  }

  // 2. Fetch server API key from settings
  const settings = readJSON(SETTINGS_FILE, {});
  const activeApiKey = (settings.elevenlabsApiKey || process.env.ELEVENLABS_API_KEY || '').trim();

  // Allow simulate mode if activeApiKey is missing or requested
  const isDemo = !activeApiKey;

  const durationSec = Math.max(10, Math.min(parseInt(duration, 10) || 30, 300));
  const songId = 'song_' + crypto.randomBytes(6).toString('hex');
  const filename = `${songId}.mp3`;
  const filePath = path.join(STORAGE_DIR, filename);

  const songStyle = style || 'Pop acústico';
  const songNames = names || 'Para alguien especial';
  const songRefs = references || 'Celebrando momentos felices y recuerdos inolvidables';
  const VALID_VOICE_GENDERS = ['masculina', 'femenina', 'ambas'];
  const songVoiceGender = VALID_VOICE_GENDERS.includes(voiceGender) ? voiceGender : 'cualquiera';

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
      const composeResult = await composeMusic({
        apiKey: activeApiKey,
        prompt,
        durationSec,
        logPrefix: `[Code: ${userCode.code}] `
      });

      audioBuffer = composeResult.audioBuffer;
      lyricsLines = composeResult.lyricsLines || [];
      if (composeResult.headerReqId) {
        elevenlabsId = composeResult.headerReqId;
      }
      if (composeResult.wasRewritten) {
        console.log(`[ELEVENLABS API] Prompt reescrito automáticamente por contenido protegido para Code: ${userCode.code}`);
      }
    }

    // Save audio file
    fs.writeFileSync(filePath, audioBuffer);
    const stats = fs.statSync(filePath);

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
      voiceGender: songVoiceGender
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
        voiceGender: songVoiceGender
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
  const { code, maxSongs, label } = req.body;
  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'El código no puede estar vacío.' });
  }

  const cleanCode = code.trim().toUpperCase();
  const codes = readJSON(CODES_FILE, []);
  const existing = codes.find((c) => c.code === cleanCode);

  if (existing) {
    return res.status(400).json({ error: 'Ya existe un código con ese identificador.' });
  }

  const newCodeObj = {
    code: cleanCode,
    maxSongs: parseInt(maxSongs, 10) === -1 ? -1 : (parseInt(maxSongs, 10) || 1),
    used: 0,
    label: label?.trim() || `Código ${cleanCode}`,
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
    const composeResult = await composeMusic({
      apiKey: activeApiKey,
      prompt,
      durationSec,
      logPrefix: `[Demo: ${demoId}] `
    });

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
});
