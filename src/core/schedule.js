// src/core/schedule.js
import { appState } from '../state/store.js';

export function buildSchedule() {
  // Build visits array based on startDate, machineCount, machineSequence, dayPattern
  const visits = [];
  const start = new Date(appState.startDate);
  let currentDate = new Date(start);
  let patternIdx = 0;
  let visitIdx = 0;
  const quarters = ['Q3 2026','Q4 2026','Q1 2027','Q2 2027','Q3 2027','Q4 2027','Q1 2028','Q2 2028'];

  // Simple schedule builder
  const totalVisits = Math.floor(appState.totalDays / appState.dayPattern.reduce((a,b)=>a+b,0) / appState.machineCount * appState.machineCount) || 32;
  appState.totalVisits = totalVisits;
  appState.totalUsed = 0;
  appState.reportsSubmitted = 0;

  for (let q = 0; q < 8; q++) {
    for (let m = 0; m < appState.machineCount; m++) {
      const machineNum = appState.machineSequence[m % appState.machineSequence.length];
      const daysPlanned = appState.dayPattern[patternIdx % appState.dayPattern.length];
      const weekStr = formatWeek(currentDate);
      const dateStr = currentDate.toISOString().split('T')[0];
      visits.push({
        id: visitIdx + 1,
        machineNum,
        machine: 'WLVIA #' + String(machineNum).padStart(3, '0'),
        week: weekStr,
        date: dateStr,
        quarter: quarters[q] || 'Q?',
        daysPlanned,
        daysUsed: 0,
        status: visitIdx === 0 ? 'Completed' : visitIdx === 1 ? 'In Progress' : 'Scheduled',
        activities: ['Laser calibration', 'Optics inspection', 'Stage alignment']
      });
      currentDate = addDays(currentDate, 7 * appState.machineCount);
      patternIdx++;
      visitIdx++;
      if (visitIdx >= totalVisits) break;
    }
    if (visitIdx >= totalVisits) break;
  }

  // Recalculate totals
  appState.visits = visits;
  appState.totalUsed = visits.reduce((s, v) => s + v.daysUsed, 0);
  appState.reportsSubmitted = visits.filter(v => v.status === 'Completed').length * 2;
}

function formatWeek(date) {
  const d = new Date(date);
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil((((d - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
  return 'WK' + weekNum;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
