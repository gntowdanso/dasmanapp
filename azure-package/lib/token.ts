import crypto from 'crypto';

export function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}
