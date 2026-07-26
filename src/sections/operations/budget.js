// src/sections/operations/budget.js
// Quarterly budget bars

import { appState } from '../../state/store.js';

function renderQuarterlyBudget() {
  const container = document.getElementById('quarterlyBudget');
  if (!container) return;
  const quarters = {};
  appState.visits.forEach(v => {
    if (!quarters[v.quarter]) quarters[v.quarter] = { planned: 0, used: 0, visits: 0 };
    quarters[v.quarter].planned += v.daysPlanned;
    quarters[v.quarter].used += v.daysUsed;
    quarters[v.quarter].visits++;
  });

  let html = '';
  Object.entries(quarters).forEach(([q, data]) => {
    const pct = data.planned > 0 ? ((data.used / data.planned) * 100).toFixed(0) : 0;
    const barColor = data.used > 0 ? 'bg-gradient-to-r from-neon-blue to-neon-purple' : 'bg-slate-600';
    html += '<div class="mb-3">';
    html += '<div class="flex justify-between text-xs mb-1"><span class="text-slate-300">' + q + '</span><span class="font-mono text-slate-300">' + data.used + ' / ' + data.planned + ' days</span></div>';
    html += '<div class="w-full bg-slate-700 rounded-full h-2"><div class="' + barColor + ' h-2 rounded-full transition-all duration-500" style="width: ' + pct + '%"></div></div>';
    html += '</div>';
  });
  container.innerHTML = html;
}
