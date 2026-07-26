// src/core/health.js
import { appState } from '../state/store.js';

export function calculateContractHealth() {
  const progress = appState.totalDays > 0 ? (appState.totalUsed / appState.totalDays) : 0;
  const reportRate = appState.visits.length > 0 ? (appState.reportsSubmitted / (appState.visits.length * 2)) : 0;
  let score = Math.round(100 - (progress * 10) + (reportRate * 10));
  return Math.min(100, Math.max(0, score));
}

export function calculateFleetHealth() {
  const ok = appState.visits.filter(v => v.status === 'Completed').length;
  const warn = appState.visits.filter(v => v.status === 'In Progress').length;
  const crit = 0;
  const total = appState.visits.length || 1;
  const score = Math.round((ok / total) * 100);
  return { score: Math.min(100, score), ok, warn, crit };
}

export function getNextMilestone() {
  const next = appState.visits.find(v => v.status === 'Scheduled');
  if (!next) return { machine: 'All complete', days: 0, hours: 0 };
  const now = new Date();
  const nextDate = new Date(next.date);
  const diffMs = nextDate - now;
  const diffDays = Math.max(0, Math.ceil(diffMs / 86400000));
  return { machine: next.machine, days: diffDays, hours: diffDays * 24 };
}
