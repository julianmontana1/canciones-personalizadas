// Password hashing for the superadmin credential. Uses Node's built-in scrypt
// (no extra dependency needed) with a random salt per password and a timing-safe
// comparison, instead of storing/comparing the password in plain text.

import crypto from 'crypto';

const KEY_LENGTH = 64;

export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
};

export const verifyPassword = (password, stored) => {
  if (!password || !stored || !stored.includes(':')) return false;

  const [salt, hashHex] = stored.split(':');
  const hashBuffer = Buffer.from(hashHex, 'hex');
  const candidateBuffer = crypto.scryptSync(password, salt, KEY_LENGTH);

  if (hashBuffer.length !== candidateBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, candidateBuffer);
};

export const generateRandomPassword = () => crypto.randomBytes(9).toString('base64url');
