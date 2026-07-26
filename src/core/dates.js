// src/core/dates.js
export function parseDate(str) {
  return new Date(str);
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatWeek(date) {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d - start + ((start.getDay() + 1) * 86400000);
  const oneWeek = 604800000;
  const weekNum = Math.ceil(diff / oneWeek);
  return 'WK' + String(weekNum).padStart(2, '0');
}

export function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}
