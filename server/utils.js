import crypto from 'crypto';

export function getWeekStart(timezone = 'UTC') {
  const now = new Date();
  const localDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const day = localDate.getDay();
  const diff = localDate.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(localDate.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function randomToken() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}
