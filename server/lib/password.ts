import crypto from 'crypto';

const SALT = 'zhino-users-v1';

export function hashPassword(password: string): string {
  return crypto.scryptSync(password, SALT, 64).toString('hex');
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  if (!passwordHash) return false;
  const next = hashPassword(password);
  try {
    return crypto.timingSafeEqual(Buffer.from(next, 'hex'), Buffer.from(passwordHash, 'hex'));
  } catch {
    return next === passwordHash;
  }
}
