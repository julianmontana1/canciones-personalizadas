import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

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

// Default settings if not exists
if (!fs.existsSync(SETTINGS_FILE)) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
    elevenlabsApiKey: process.env.ELEVENLABS_API_KEY || '',
    adminPassword: process.env.ADMIN_PASSWORD || 'admin123'
  }, null, 2), 'utf-8');
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
app.use(cors());
app.use(express.json());

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
  const settings = readJSON(SETTINGS_FILE, { adminPassword: 'admin123' });
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== settings.adminPassword) {
    return res.status(401).json({ error: 'Acceso no autorizado. Clave de Superadmin inválida.' });
  }
  next();
};

// --- GENERAL & PUBLIC ENDPOINTS ---

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Admin verify key
app.post('/api/admin/verify', (req, res) => {
  const { password } = req.body;
  const settings = readJSON(SETTINGS_FILE, { adminPassword: 'admin123' });
  if (password === settings.adminPassword) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
});

// Validate user access code
app.get('/api/codes/validate', (req, res) => {
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
      timestamp: s.timestamp
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

// Generate song endpoint
app.post('/api/generate', async (req, res) => {
  const ip = getClientIp(req);
  const { code, names, references, style, duration, simulate } = req.body;

  // 1. Verify access code
  const codeParam = (code || '').trim().toUpperCase();
  if (!codeParam) {
    return res.status(400).json({ error: 'Se requiere un código de acceso para generar canciones.' });
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

  // 2. Fetch server API key from settings
  const settings = readJSON(SETTINGS_FILE, {});
  const activeApiKey = (settings.elevenlabsApiKey || process.env.ELEVENLABS_API_KEY || '').trim();

  // Allow simulate mode if activeApiKey is missing or requested
  const isDemo = Boolean(simulate || !activeApiKey);

  const durationSec = Math.max(10, Math.min(parseInt(duration, 10) || 30, 300));
  const songId = 'song_' + crypto.randomBytes(6).toString('hex');
  const filename = `${songId}.mp3`;
  const filePath = path.join(STORAGE_DIR, filename);

  const songStyle = style || 'Pop acústico';
  const songNames = names || 'Para alguien especial';
  const songRefs = references || 'Celebrando momentos felices y recuerdos inolvidables';

  const prompt = `A dynamic, high-fidelity ${songStyle} song dedicated to "${songNames}". Inspiration and lyrical context: ${songRefs}. Studio production, melodic hooks, emotional vocals and rhythm.`;

  let elevenlabsId = `el_${crypto.randomBytes(8).toString('hex')}`;
  let audioBuffer = null;

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
      const elevenRes = await fetch('https://api.elevenlabs.io/v1/music/compose', {
        method: 'POST',
        headers: {
          'xi-api-key': activeApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          music_length_ms: durationSec * 1000,
          model_id: 'music_v2'
        })
      });

      if (!elevenRes.ok) {
        let errDetails = '';
        try {
          const errJson = await elevenRes.json();
          errDetails = errJson.detail?.message || errJson.message || JSON.stringify(errJson);
        } catch {
          errDetails = await elevenRes.text();
        }
        console.error(`ElevenLabs API error (${elevenRes.status}):`, errDetails);
        return res.status(elevenRes.status).json({
          error: `Error de ElevenLabs (${elevenRes.status}): ${errDetails}`
        });
      }

      const headerReqId = elevenRes.headers.get('request-id') || elevenRes.headers.get('x-request-id');
      if (headerReqId) {
        elevenlabsId = headerReqId;
      }

      const arrayBuffer = await elevenRes.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);
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
      isSimulated: isDemo
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
        style: songStyle,
        duration: durationSec,
        audioUrl: `/api/storage/songs/${filename}`,
        filename: filename
      }
    });

  } catch (error) {
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
  const settings = readJSON(SETTINGS_FILE, { elevenlabsApiKey: '', adminPassword: 'admin123' });
  const rawKey = settings.elevenlabsApiKey || '';
  const maskedKey = rawKey ? `${rawKey.slice(0, 6)}...${rawKey.slice(-4)}` : '';

  res.json({
    hasKey: Boolean(rawKey),
    maskedKey: maskedKey,
    hasPassword: Boolean(settings.adminPassword)
  });
});

// Update settings
app.post('/api/admin/settings', verifyAdmin, (req, res) => {
  const { elevenlabsApiKey, newAdminPassword } = req.body;
  const settings = readJSON(SETTINGS_FILE, { elevenlabsApiKey: '', adminPassword: 'admin123' });

  if (elevenlabsApiKey !== undefined) {
    settings.elevenlabsApiKey = elevenlabsApiKey.trim();
  }
  if (newAdminPassword && newAdminPassword.trim().length >= 4) {
    settings.adminPassword = newAdminPassword.trim();
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

// Serve frontend static files if dist folder exists (production / Docker mode)
const DIST_DIR = path.join(__dirname, '../dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res) => {
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
