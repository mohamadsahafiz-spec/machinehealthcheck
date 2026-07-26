// Auto-generated section module — a4.6 refactor
import { appState } from '../state/store.js';
import { triggerRenderAll } from '../core/lifecycle.js';
import { openModalA11y, closeModalA11y } from '../ui/modal-system.js';
import { addChangeLogEntry } from '../ui/change-log-modal.js';
import { uploadAndStoreImage } from '../state/persist.js';
import { parseDate, addDays, formatWeek, formatDate } from '../core/dates.js';
import { calculateContractHealth, calculateFleetHealth, getNextMilestone } from '../core/health.js';
import { buildSchedule } from '../core/schedule.js';

// ===================== CALENDAR MODAL =====================
export function openCalendar() {
  lastFocusedElement = document.activeElement;
  const quarters = {};
  appState.visits.forEach(v => {
    if (!quarters[v.quarter]) quarters[v.quarter] = [];
    quarters[v.quarter].push(v);
  });

  let qHtml = '';
  Object.entries(quarters).forEach(([q, visits]) => {
    const qDays = visits.reduce((s, v) => s + v.daysPlanned, 0);
    const qUsed = visits.reduce((s, v) => s + v.daysUsed, 0);
    qHtml += '<div class="quarter-block">';
    qHtml += '<div class="flex items-center justify-between mb-3 pb-2 border-b border-white/5">';
    qHtml += '<span class="text-sm font-bold text-white">' + q + '</span>';
    qHtml += '<span class="text-xs text-slate-400 font-mono">' + qUsed + '/' + qDays + ' days · ' + visits.length + ' visits</span>';
    qHtml += '</div>';
    visits.forEach(v => {
      let dot = '<span class="status-dot status-scheduled"></span>';
      if (v.status === 'Completed') dot = '<span class="status-dot status-completed"></span>';
      else if (v.status === 'In Progress') dot = '<span class="status-dot status-progress"></span>';

      qHtml += '<div class="visit-row">';
      qHtml += '<div class="flex items-center gap-2"><div class="machine-badge bg-slate-700/50 text-slate-300 text-xs">M' + v.machineNum + '</div><span class="text-slate-300">' + v.week + '</span><span class="text-xs text-slate-500">' + v.date + '</span></div>';
      qHtml += '<div class="flex items-center gap-2"><span class="text-xs text-slate-500">' + v.daysPlanned + 'd</span>' + dot + '<span class="text-xs text-slate-400">' + v.status + '</span></div>';
      qHtml += '</div>';
    });
    qHtml += '</div>';
  });
  document.getElementById('calendarQuarterly').innerHTML = qHtml;

  let tHtml = '';
  appState.visits.forEach(v => {
    let statusClass = 'bg-slate-700/50 text-slate-400';
    if (v.status === 'Completed') statusClass = 'bg-neon-green/10 text-neon-green';
    else if (v.status === 'In Progress') statusClass = 'bg-neon-amber/10 text-neon-amber';

    tHtml += '<tr>';
    tHtml += '<td class="font-mono text-neon-blue">' + v.week + '</td>';
    tHtml += '<td class="text-slate-400">' + v.date + '</td>';
    tHtml += '<td class="font-medium">' + v.machine + '</td>';
    tHtml += '<td class="text-slate-400">' + v.quarter + '</td>';
    tHtml += '<td class="font-mono">' + v.daysPlanned + '</td>';
    tHtml += '<td><span class="px-2 py-0.5 rounded text-xs ' + statusClass + '">' + v.status + '</span></td>';
    tHtml += '<td class="text-xs text-slate-500">' + v.activities.join(', ') + '</td>';
    tHtml += '</tr>';
  });
  document.getElementById('calendarTableBody').innerHTML = tHtml;

  openModalA11y('calendarModal');
}

export function closeCalendar() { closeModalA11y('calendarModal'); }

