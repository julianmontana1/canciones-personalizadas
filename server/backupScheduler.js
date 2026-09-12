import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

const FILES_TO_BACKUP = [
  'history.json',
  'codes.json',
  'settings.json',
  'planOverrides.json'
];

// Mantiene un máximo de 24 backups (48 horas a 1 cada 2h)
const MAX_BACKUPS = 24;

export const createBackup = () => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const currentBackupDir = path.join(BACKUP_DIR, `backup_${timestamp}`);
    
    fs.mkdirSync(currentBackupDir);

    let backedUpCount = 0;
    for (const file of FILES_TO_BACKUP) {
      const source = path.join(DATA_DIR, file);
      if (fs.existsSync(source)) {
        fs.copyFileSync(source, path.join(currentBackupDir, file));
        backedUpCount++;
      }
    }

    console.log(`[BACKUP] Creado backup con ${backedUpCount} archivos en ${currentBackupDir}`);

    // Cleanup old backups
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(name => name.startsWith('backup_'))
      .map(name => ({
        name,
        path: path.join(BACKUP_DIR, name),
        time: fs.statSync(path.join(BACKUP_DIR, name)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // newest first

    if (backups.length > MAX_BACKUPS) {
      const toDelete = backups.slice(MAX_BACKUPS);
      for (const backup of toDelete) {
        fs.rmSync(backup.path, { recursive: true, force: true });
        console.log(`[BACKUP] Eliminado backup antiguo: ${backup.name}`);
      }
    }
  } catch (error) {
    console.error('[BACKUP] Error al crear el backup:', error);
  }
};

export const startBackupScheduler = () => {
  // Ejecutar inmediatamente al iniciar
  createBackup();
  
  // Ejecutar cada 2 horas (2 * 60 * 60 * 1000 ms)
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  setInterval(createBackup, TWO_HOURS_MS);
  console.log('[BACKUP] Scheduler iniciado (cada 2 horas)');
};
