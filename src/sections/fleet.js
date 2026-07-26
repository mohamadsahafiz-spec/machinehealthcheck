// src/sections/fleet.js
// Machine cards, machine detail modal

import { appState } from '../../state/store.js';
import { formatWeek, addDays } from '../../core/dates.js';
import { openModalA11y, closeModalA11y } from '../../ui/modal-system.js';

let machineTrendChart = null;

function renderMachineCards() {
  const container = document.getElementById('machineCards');
  if (!container) return;
  let html = '';
  for (let m = 1; m <= appState.machineCount; m++) {
    const mVisits = appState.visits.filter(v => v.machineNum === m);
    const done = mVisits.filter(v => v.status === 'Completed').length;
    const active = mVisits.filter(v => v.status === 'In Progress').length;
    const scheduled = mVisits.filter(v => v.status === 'Scheduled').length;
    const daysUsed = mVisits.reduce((s, v) => s + v.daysUsed, 0);
    const daysPlanned = mVisits.reduce((s, v) => s + v.daysPlanned, 0);
    const nextVisit = mVisits.find(v => v.status === 'In Progress') || mVisits.find(v => v.status === 'Scheduled');
    const lastVisit = [...mVisits].reverse().find(v => v.status === 'Completed');
    const seqPos = appState.machineSequence.indexOf(m) + 1;

    let borderColor = 'border-slate-500';
    let statusTag = '<span class="px-2 py-1 rounded-md text-xs font-mono bg-slate-700/50 text-slate-400 border border-slate-600">SCHEDULED</span>';
    let badgeBg = 'bg-slate-700/50';
    let badgeText = 'text-slate-400';

    if (active > 0) { 
      borderColor = 'border-neon-amber'; 
      statusTag = '<span class="px-2 py-1 rounded-md text-xs font-mono bg-neon-amber/10 text-neon-amber border border-neon-amber/20 animate-pulse">IN PROGRESS</span>';
      badgeBg = 'bg-neon-amber/10'; badgeText = 'text-neon-amber';
    } else if (done > 0 && scheduled === 0) { 
      borderColor = 'border-neon-green'; 
      statusTag = '<span class="px-2 py-1 rounded-md text-xs font-mono bg-neon-green/10 text-neon-green border border-neon-green/20">COMPLETED</span>';
      badgeBg = 'bg-neon-green/10'; badgeText = 'text-neon-green';
    } else if (done > 0) { 
      borderColor = 'border-neon-green'; 
      statusTag = '<span class="px-2 py-1 rounded-md text-xs font-mono bg-neon-green/10 text-neon-green border border-neon-green/20">PARTIAL</span>';
      badgeBg = 'bg-neon-green/10'; badgeText = 'text-neon-green';
    }

    html += '<div class="machine-card glass rounded-xl p-5 border-l-4 ' + borderColor + ' cursor-pointer" onclick="openMachineDetailModal(' + m + ')">';
    html += '<div class="flex items-center justify-between mb-3">';
    html += '<div class="flex items-center gap-3">';
    html += '<div class="w-10 h-10 rounded-lg ' + badgeBg + ' flex items-center justify-center">';
    html += '<span class="font-mono font-bold ' + badgeText + '">M' + m + '</span>';
    html += '</div><div>';
    html += '<h3 class="font-semibold text-white">Machine ' + m + '</h3>';
    html += '<p class="text-xs text-slate-400">Seq #' + seqPos + ' • WLVIA #' + String(m).padStart(3, '0') + '</p>';
    html += '</div></div>' + statusTag + '</div>';
    html += '<div class="space-y-2 mb-3">';
    html += '<div class="flex justify-between text-xs"><span class="text-slate-400">Days Used</span><span class="text-white font-mono">' + daysUsed + ' / ' + daysPlanned + ' planned</span></div>';
    if (lastVisit) html += '<div class="flex justify-between text-xs"><span class="text-slate-400">Last Service</span><span class="text-slate-300 font-mono">' + lastVisit.week + ' (' + lastVisit.quarter + ')</span></div>';
    if (nextVisit) html += '<div class="flex justify-between text-xs"><span class="text-slate-400">Next Due</span><span class="text-neon-blue font-mono">' + nextVisit.week + ' (' + nextVisit.quarter + ')</span></div>';
    html += '</div>';
    if (active > 0) {
      html += '<div class="w-full bg-slate-700 rounded-full h-1.5 mb-2"><div class="bg-neon-amber h-1.5 rounded-full animate-pulse" style="width: 33%"></div></div>';
      html += '<div class="flex gap-2 flex-wrap">';
      nextVisit.activities.forEach((act, i) => {
        html += '<span class="px-2 py-0.5 rounded text-xs ' + (i === 0 ? 'bg-neon-amber/20 text-neon-amber border border-neon-amber/30' : 'bg-slate-700/50 text-slate-400') + '">' + act + '</span>';
      });
      html += '</div>';
    } else if (done > 0) {
      html += '<div class="flex gap-2 flex-wrap">';
      html += '<span class="px-2 py-0.5 rounded text-xs bg-neon-green/10 text-neon-green border border-neon-green/20">Laser ✓</span>';
      html += '<span class="px-2 py-0.5 rounded text-xs bg-neon-green/10 text-neon-green border border-neon-green/20">Optics ✓</span>';
      html += '<span class="px-2 py-0.5 rounded text-xs bg-neon-green/10 text-neon-green border border-neon-green/20">Stage ✓</span>';
      html += '</div>';
    } else {
      html += '<div class="flex gap-2 flex-wrap">';
      html += '<span class="px-2 py-0.5 rounded text-xs bg-slate-700/50 text-slate-400">Laser Kit</span>';
      html += '<span class="px-2 py-0.5 rounded text-xs bg-slate-700/50 text-slate-400">Power Meter</span>';
      html += '</div>';
    }
    html += '</div>';
  }
  container.innerHTML = html;
}

function openMachineDetailModal(machineNum) {
  const modal = document.getElementById('machineDetailModal');
  const mVisits = appState.visits.filter(v => v.machineNum === machineNum);
  const done = mVisits.filter(v => v.status === 'Completed').length;
  const next = mVisits.find(v => v.status === 'Scheduled');

  document.getElementById('machineDetailTitle').textContent = 'WLVIA #' + machineNum + ' — Detailed View';
  document.getElementById('mdVisitsDone').textContent = done;
  document.getElementById('mdVisitsTotal').textContent = mVisits.length;
  document.getElementById('mdNextService').textContent = next ? next.week : 'Complete';
  document.getElementById('mdNextQuarter').textContent = next ? next.quarter : '-';

  // Calculate health score for this machine
  const mParams = appState.laserParams;
  const passCount = mParams.filter(p => p.status === 'Pass').length;
  const score = mParams.length > 0 ? Math.round((passCount / mParams.length) * 100) : 100;
  document.getElementById('mdHealthScore').textContent = score;
  document.getElementById('mdHealthBar').style.width = score + '%';

  // Render history
  let histHtml = '';
  mVisits.forEach(v => {
    let statusColor = v.status === 'Completed' ? 'text-neon-green' : v.status === 'In Progress' ? 'text-neon-amber' : 'text-slate-400';
    let statusBg = v.status === 'Completed' ? 'bg-neon-green/10' : v.status === 'In Progress' ? 'bg-neon-amber/10' : 'bg-slate-700/30';
    histHtml += '<div class="flex items-center justify-between p-3 rounded-lg ' + statusBg + ' border border-slate-700/30">';
    histHtml += '<div class="flex items-center gap-3"><span class="font-mono text-xs ' + statusColor + '">' + v.week + '</span><span class="text-xs text-slate-400">' + v.quarter + '</span></div>';
    histHtml += '<div class="flex items-center gap-2"><span class="text-xs text-slate-400">' + v.daysPlanned + ' days</span><span class="px-2 py-0.5 rounded text-xs ' + statusColor + '">' + v.status + '</span></div>';
    histHtml += '</div>';
  });
  document.getElementById('machineHistoryList').innerHTML = histHtml;

  // Render predictions
  const uvHours = [18500, 21200, 19800, 15400, 17600][machineNum - 1] || 18000;
  const remaining = 25000 - uvHours;
  const daysLeft = Math.ceil(remaining / 8);
  const predHtml = '<p class="text-xs text-slate-300"><i class="fas fa-lightbulb text-neon-amber mr-1"></i> UV Laser has <strong>' + remaining.toLocaleString() + 'h</strong> remaining. At 8h/day production, replacement needed in approximately <strong>' + daysLeft + ' days</strong> (around ' + formatWeek(addDays(new Date(), daysLeft)) + ').</p>';
  document.getElementById('machinePredictions').innerHTML = predHtml;

  // Render trend chart
  setTimeout(() => {
    const ctx = document.getElementById('machineTrendChart');
    if (machineTrendChart) machineTrendChart.destroy();
    machineTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'],
        datasets: [
          { label: 'Laser Power %', data: [88, 85, 92, score], borderColor: '#00d4ff', backgroundColor: 'transparent', tension: 0.4 },
          { label: 'Accuracy μm', data: [3.0, 2.5, 1.5, 1.2], borderColor: '#a855f7', backgroundColor: 'transparent', tension: 0.4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 0 }, resizeDelay: 500,
        layout: { padding: 4 },
        scales: { y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { ticks: { color: '#94a3b8' }, grid: { display: false } } },
        plugins: { legend: { labels: { color: '#e2e8f0' } } }
      }
    });
  }, 100);

  openModalA11y('machineDetailModal');
}

function closeMachineDetailModal() {
  if (machineTrendChart) { machineTrendChart.destroy(); machineTrendChart = null; }
  closeModalA11y('machineDetailModal');
}
