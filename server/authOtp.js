import crypto from 'crypto';

export function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashOtp(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function isDevEnv() {
  return process.env.NODE_ENV !== 'production';
}
