// src/core/dates.js
export function parseDate(str) { return new Date(str); }
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
export function formatWeek(date) {
  const d = new Date(date);
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil((((d - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
  return 'WK' + weekNum;
}
export function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}
