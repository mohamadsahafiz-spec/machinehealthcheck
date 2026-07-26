// src/core/health.js
import { appState } from '../state/store.js';

export function calculateContractHealth() {
  if (appState.totalDays === 0) return 100;
  const progress = appState.totalUsed / appState.totalDays;
  const reportRate = appState.reportsSubmitted / (appState.visits.length * 2 || 1);
  return Math.round((1 - progress) * 50 + reportRate * 50);
}

export function calculateFleetHealth() {
  const machines = appState.machineCount;
  const ok = Math.ceil(machines * 0.6);
  const warn = Math.ceil(machines * 0.3);
  const crit = machines - ok - warn;
  const score = Math.round((ok * 100 + warn * 70 + crit * 30) / machines);
  return { score, ok, warn, crit };
}

export function getNextMilestone() {
  const machines = ['M1', 'M2', 'M3', 'M4', 'M5'];
  const machine = machines[Math.floor(Math.random() * machines.length)];
  const days = Math.floor(Math.random() * 60) + 15;
  const hours = days * 8;
  return { machine, days, hours };
}
