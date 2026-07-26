// src/core/schedule.js
import { appState } from '../state/store.js';
import { addDays, formatWeek } from './dates.js';

export function buildSchedule() {
  // Build a sample schedule based on appState parameters
  const visits = [];
  const start = new Date(appState.startDate);
  let currentDate = new Date(start);
  let visitIndex = 0;
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  for (let m = 0; m < appState.machineCount; m++) {
    const machineNum = appState.machineSequence[m] || (m + 1);
    const machineName = 'WLVIA #' + String(machineNum).padStart(3, '0');

    for (let v = 0; v < appState.totalVisits / appState.machineCount; v++) {
      const daysPlanned = appState.dayPattern[v % appState.dayPattern.length] || 3;
      const quarter = quarters[Math.floor(visitIndex / 4) % 4] + ' ' + (start.getFullYear() + Math.floor(visitIndex / 16));

      visits.push({
        id: visitIndex + 1,
        machineNum: machineNum,
        machine: machineName,
        week: formatWeek(currentDate),
        date: currentDate.toISOString().split('T')[0],
        quarter: quarter,
        daysPlanned: daysPlanned,
        daysUsed: 0,
        status: 'Scheduled',
        activities: ['Laser Health Check', 'Optics Inspection', 'Stage Calibration']
      });

      currentDate = addDays(currentDate, 7);
      visitIndex++;
    }
  }

  appState.visits = visits;
  appState.totalVisits = visits.length;
}
