import crypto from 'crypto';

export function getWeekStart(timezone = 'UTC', resetDay = 1) {
  const now = new Date();
  const localDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const day = localDate.getDay();
  const normalizedResetDay =
    Number.isInteger(resetDay) && resetDay >= 0 && resetDay <= 6 ? resetDay : 1;
  const diff = localDate.getDate() - ((day - normalizedResetDay + 7) % 7);
  const start = new Date(localDate.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
}

export function randomToken() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}
