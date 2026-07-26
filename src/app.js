// src/app.js
import { appState, getState, setState, subscribe } from './state/store.js';
import * as dates from './core/dates.js';
import { buildSchedule } from './core/schedule.js';
import { calculateContractHealth, calculateFleetHealth, getNextMilestone } from './core/health.js';
import { openModalA11y, closeModalA11y } from './ui/modal-system.js';
import { scrollToSection, toggleMobileSidebar } from './ui/sidebar.js';
import { createChart, destroyChart, destroyAllCharts } from './ui/charts.js';
import { uploadAndStoreImage } from './state/persist.js';
import { exportContract, importContract } from './sections/operations/export-import.js';
import { openChangeLogModal, closeChangeLogModal, addChangeLogEntry } from './ui/change-log-modal.js';



// ===================== STATE =====================
// ===================== DATE HELPERS =====================
// ===================== MACHINE SEQUENCE =====================
function renderMachineSequence() {
  const container = document.getElementById('machineSequenceDisplay');
  if (!container) return;
  const seq = appState.machineSequence;
  let html = '';
  seq.forEach((m, i) => {
    const colors = ['bg-neon-blue/20 text-neon-blue', 'bg-neon-purple/20 text-neon-purple', 'bg-neon-green/20 text-neon-green', 'bg-neon-amber/20 text-neon-amber', 'bg-neon-red/20 text-neon-red'];
    const colorClass = colors[i % colors.length];
    html += '<div class="machine-seq-badge ' + colorClass + ' border border-white/10">' + m + '</div>';
    if (i < seq.length - 1) html += '<i class="fas fa-arrow-right text-slate-600 text-xs"></i>';
  });
  container.innerHTML = html;
}

function updateMachineSequence() {
  const input = document.getElementById('machineSequenceInput').value;
  let seq = input.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0 && n <= appState.machineCount);
  seq = [...new Set(seq)];
  if (seq.length > 0) {
    appState.machineSequence = seq;
    buildSchedule();
    renderAll();
  } else {
    appState.machineSequence = Array.from({length: appState.machineCount}, (_, i) => i + 1);
    document.getElementById('machineSequenceInput').value = appState.machineSequence.join(',');
    buildSchedule();
    renderAll();
  }
}

// ===================== RENDERERS =====================
function renderKPIs() {
  const progressEl = document.getElementById('kpiProgress');
  if (!progressEl) return;
  const progress = appState.totalDays > 0 ? ((appState.totalUsed / appState.totalDays) * 100).toFixed(1) : 0;
  const remaining = appState.totalDays - appState.totalUsed;
  const remainingPct = appState.totalDays > 0 ? ((remaining / appState.totalDays) * 100).toFixed(0) : 100;
  const done = appState.visits.filter(v => v.status === 'Completed').length;
  const active = appState.visits.filter(v => v.status === 'In Progress').length;
  const planned = appState.visits.filter(v => v.status === 'Scheduled').length;
  const next = appState.visits.find(v => v.status === 'Scheduled');
  const reportsTotal = appState.visits.length * 2;
  const reportsPct = reportsTotal > 0 ? ((appState.reportsSubmitted / reportsTotal) * 100).toFixed(1) : 0;

  document.getElementById('kpiProgress').textContent = progress + '%';
  document.getElementById('progressBar').style.width = progress + '%';
  document.getElementById('kpiProgressDetail').textContent = appState.totalUsed + ' of ' + appState.totalDays + ' days consumed';
  document.getElementById('kpiRemaining').textContent = remaining;
  document.getElementById('remainingBar').style.width = remainingPct + '%';
  document.getElementById('kpiRemainingText').textContent = remainingPct >= 80 ? 'Budget healthy — ' + remainingPct + '% remaining' : remainingPct >= 50 ? 'Budget on track — ' + remainingPct + '% remaining' : 'Budget warning — ' + remainingPct + '% remaining';
  document.getElementById('machineCountLabel').textContent = appState.machineCount + ' Machines';
  document.getElementById('kpiDone').textContent = done;
  document.getElementById('kpiActive').textContent = active;
  document.getElementById('kpiPlanned').textContent = planned;
  document.getElementById('kpiNext').textContent = next ? 'Next: ' + next.machine + ' (' + next.week + ')' : 'All complete';
  document.getElementById('kpiReports').textContent = appState.reportsSubmitted;
  document.getElementById('kpiReportsTotal').textContent = '/ ' + reportsTotal + ' submitted';
  document.getElementById('reportBar').style.width = reportsPct + '%';
  document.getElementById('totalVisitsDisplay').textContent = appState.totalVisits;
  document.getElementById('patternDisplay').textContent = appState.dayPattern.join(',');

  const start = parseDate(appState.startDate);
  const end = addDays(new Date(start), appState.contractYears * 365);
  document.getElementById('headerPeriod').textContent = formatWeek(start) + ' ' + start.getFullYear() + ' → ' + formatWeek(end) + ' ' + end.getFullYear();

  const now = new Date();
  document.getElementById('headerCurrentWeek').textContent = formatWeek(now) + ' ' + now.getFullYear();

  document.getElementById('footerText').textContent = 'Contract: ' + appState.totalDays + ' days over ' + appState.contractYears + ' years (' + appState.totalVisits + ' visits) • ' + appState.machineCount + ' Machines • Seq: ' + appState.machineSequence.join('→') + ' • Excludes BMD250WM';
  document.getElementById('modalSubtitle').textContent = appState.totalDays + ' days · ' + appState.totalVisits + ' visits · ' + appState.machineCount + ' machines · Seq: ' + appState.machineSequence.join('→') + ' · ' + start.getFullYear() + '–' + end.getFullYear();
  document.getElementById('calendarBtnText').textContent = '(' + appState.totalDays + ' days · ' + appState.totalVisits + ' visits · ' + appState.machineCount + ' machines)';

  // Update Contract Health Score
  const healthScore = calculateContractHealth();
  const healthEl = document.getElementById('contractHealthScore');
  if (healthEl) healthEl.innerHTML = healthScore + '<span class="text-xs text-slate-400">/100</span>';
  const badge = document.getElementById('contractHealthBadge');
  if (badge) {
    if (healthScore >= 90) badge.className = 'flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-green/10 to-emerald-500/10 border border-neon-green/30';
    else if (healthScore >= 70) badge.className = 'flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-amber/10 to-orange-500/10 border border-neon-amber/30';
    else badge.className = 'flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-red/10 to-red-500/10 border border-neon-red/30';
  }

  // Update Executive Summary
  const fleet = calculateFleetHealth();
  const execScore = document.getElementById('execFleetScore');
  if (execScore) execScore.textContent = fleet.score;
  const execBar = document.getElementById('execFleetBar');
  if (execBar) execBar.style.width = fleet.score + '%';
  const execOK = document.getElementById('execMachinesOK');
  if (execOK) execOK.textContent = fleet.ok;
  const execWarn = document.getElementById('execMachinesWarn');
  if (execWarn) execWarn.textContent = fleet.warn;
  const execCrit = document.getElementById('execMachinesCrit');
  if (execCrit) execCrit.textContent = fleet.crit;

  const milestone = getNextMilestone();
  const execMilestone = document.getElementById('execNextMilestone');
  if (execMilestone) {
    execMilestone.innerHTML = '<i class="fas fa-flag-checkered text-neon-amber mt-0.5"></i><div><p class="text-sm font-medium text-white">Next Critical Milestone</p><p class="text-xs text-slate-400">UV Laser on ' + milestone.machine + ' replacement due in <strong class="text-neon-amber">' + milestone.days + ' days</strong> (' + milestone.hours.toLocaleString() + 'h remaining)</p></div>';
  }
}

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

function renderTimeline() {
  const container = document.getElementById('timelineContent');
  if (!container) return;
  const recent = appState.visits.slice(0, 6);
  let html = '<div class="timeline-line"></div>';

  recent.forEach((v, i) => {
    let dotClass = 'bg-slate-600';
    let dotShadow = '';
    let textClass = 'text-slate-400';
    let titleClass = 'text-slate-300';

    if (v.status === 'Completed') { dotClass = 'bg-neon-green'; dotShadow = 'shadow-lg shadow-neon-green/50'; textClass = 'text-neon-green'; titleClass = 'text-white'; }
    else if (v.status === 'In Progress') { dotClass = 'bg-neon-amber'; dotShadow = 'shadow-lg shadow-neon-amber/50 animate-pulse'; textClass = 'text-neon-amber'; titleClass = 'text-white'; }

    html += '<div class="mb-6 relative">';
    html += '<div class="absolute -left-8 top-1 w-4 h-4 rounded-full ' + dotClass + ' border-2 border-dark-900 ' + dotShadow + '"></div>';
    html += '<div class="text-xs ' + textClass + ' font-mono mb-1">' + v.week + ' — ' + v.status.toUpperCase() + '</div>';
    html += '<h4 class="text-sm font-semibold ' + titleClass + '">' + v.machine + ' Health Check</h4>';
    html += '<p class="text-xs text-slate-400">' + v.daysPlanned + ' days • ' + v.activities.join(', ') + '</p>';
    if (v.status === 'In Progress') {
      html += '<div class="w-full bg-slate-700 rounded-full h-1.5 mt-2"><div class="bg-neon-amber h-1.5 rounded-full" style="width: 33%"></div></div>';
    }
    if (v.status === 'Completed') {
      html += '<div class="flex gap-2 mt-2"><span class="px-2 py-0.5 rounded text-xs bg-neon-green/10 text-neon-green">Cal Report ✓</span><span class="px-2 py-0.5 rounded text-xs bg-neon-green/10 text-neon-green">Buyoff ✓</span></div>';
    }
    html += '</div>';
  });
  container.innerHTML = html;
}

function renderAlerts() {
  const container = document.getElementById('alertsContent');
  if (!container) return;
  const next = appState.visits.find(v => v.status === 'Scheduled');
  const inProgress = appState.visits.find(v => v.status === 'In Progress');
  const asapParts = appState.spareParts.filter(p => p.replaceBy === 'ASAP');

  let html = '';

  if (asapParts.length > 0) {
    asapParts.forEach(p => {
      html += '<div class="flex items-start gap-3 p-3 rounded-lg bg-neon-red/5 border border-neon-red/10">';
      html += '<i class="fas fa-exclamation-circle text-neon-red mt-0.5"></i>';
      html += '<div><p class="text-sm font-medium text-white">Replace ' + p.part + ' ASAP</p>';
      html += '<p class="text-xs text-slate-400">' + p.machine + ' • ' + p.cost + ' • Critical — immediate replacement required</p></div></div>';
    });
  }

  if (inProgress) {
    html += '<div class="flex items-start gap-3 p-3 rounded-lg bg-neon-amber/5 border border-neon-amber/10">';
    html += '<i class="fas fa-spinner text-neon-amber mt-0.5 animate-spin"></i>';
    html += '<div><p class="text-sm font-medium text-white">Complete ' + inProgress.machine + ' Health Check</p>';
    html += '<p class="text-xs text-slate-400">' + inProgress.week + ' — ' + inProgress.activities.join(', ') + '</p></div></div>';
  }

  html += '<div class="flex items-start gap-3 p-3 rounded-lg bg-neon-blue/5 border border-neon-blue/10">';
  html += '<i class="fas fa-file-alt text-neon-blue mt-0.5"></i>';
  html += '<div><p class="text-sm font-medium text-white">Submit Reports for Completed Visits</p>';
  html += '<p class="text-xs text-slate-400">Calibration reports & buyoff reports due within 48 hours</p></div></div>';

  if (next) {
    html += '<div class="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">';
    html += '<i class="fas fa-tools text-slate-400 mt-0.5"></i>';
    html += '<div><p class="text-sm font-medium text-slate-300">Prepare for ' + next.machine + '</p>';
    html += '<p class="text-xs text-slate-500">' + next.week + ' — Laser kit & power meter prep needed</p></div></div>';
  }

  container.innerHTML = html;
}

function renderParams() {
  const container = document.getElementById('paramGrid');
  if (!container) return;
  let html = '';
  appState.laserParams.forEach(p => {
    const statusColor = p.status === 'Pass' ? 'text-neon-green' : p.status === 'Fail' ? 'text-neon-red' : 'text-neon-amber';
    const statusBg = p.status === 'Pass' ? 'bg-neon-green/10' : p.status === 'Fail' ? 'bg-neon-red/10' : 'bg-neon-amber/10';
    const statusBorder = p.status === 'Pass' ? 'border-neon-green/20' : p.status === 'Fail' ? 'border-neon-red/20' : 'border-neon-amber/20';
    html += '<div class="glass rounded-xl p-4 border border-slate-700/50 hover:border-neon-blue/30 transition-all">';
    html += '<div class="flex items-center justify-between mb-2">';
    html += '<span class="text-xs text-slate-400 font-medium">' + p.param + '</span>';
    html += '<i class="fas ' + p.icon + ' ' + p.color + '"></i>';
    html += '</div>';
    html += '<div class="flex items-end gap-2 mb-1">';
    html += '<div class="text-center"><p class="text-[10px] text-slate-500 mb-0.5">Before</p><span class="text-lg font-bold text-slate-500">' + p.before + '</span></div>';
    html += '<i class="fas fa-arrow-right text-xs text-slate-600 self-center mt-3"></i>';
    html += '<div class="text-center"><p class="text-[10px] text-slate-500 mb-0.5">After</p><span class="text-lg font-bold ' + statusColor + '">' + p.after + '</span></div>';
    html += '</div>';
    html += '<div class="mt-2 space-y-1">';
    html += '<p class="text-[10px] text-slate-500"><span class="text-slate-400">Target:</span> ' + p.target + '</p>';
    html += '<p class="text-[10px] text-slate-500"><span class="text-slate-400">Spec:</span> ' + (p.specRange || '-') + '</p>';
    html += '<p class="text-[10px] text-slate-500"><span class="text-slate-400">@</span> ' + (p.measureAt || '-') + '</p>';
    html += '<div class="flex items-center gap-2 mt-1">';
    html += '<span class="text-[9px] text-slate-600">' + (p.beforeDate || '-') + '</span>';
    html += '<i class="fas fa-arrow-right text-[8px] text-slate-700"></i>';
    html += '<span class="text-[9px] text-slate-600">' + (p.afterDate || '-') + '</span>';
    html += '</div>';
    html += '</div>';
    html += '<span class="inline-block mt-2 px-2 py-0.5 rounded text-xs ' + statusBg + ' ' + statusColor + ' border ' + statusBorder + '">' + p.status.toUpperCase() + '</span>';
    html += '</div>';
  });
  container.innerHTML = html;
}

function renderSpareParts() {
  const container = document.getElementById('sparePartsList');
  if (!container) return;
  let html = '';
  appState.spareParts.forEach(sp => {
    let icon = 'fa-circle';
    let iconColor = 'text-slate-400';
    if (sp.status === 'Monitor') { icon = 'fa-check-circle'; iconColor = 'text-neon-green'; }
    else if (sp.status === 'Plan Order') { icon = 'fa-exclamation-circle'; iconColor = 'text-neon-amber'; }
    else if (sp.status === 'OK') { icon = 'fa-check-double'; iconColor = 'text-neon-blue'; }
    else if (sp.replaceBy === 'ASAP') { icon = 'fa-radiation'; iconColor = 'text-neon-red'; }

    const replaceBadge = sp.replaceBy === 'ASAP' 
      ? '<span class="px-2 py-0.5 rounded text-xs bg-neon-red/10 text-neon-red border border-neon-red/20">ASAP</span>'
      : sp.replaceBy === 'Next quarter'
      ? '<span class="px-2 py-0.5 rounded text-xs bg-neon-amber/10 text-neon-amber border border-neon-amber/20">Next Q</span>'
      : '<span class="px-2 py-0.5 rounded text-xs bg-slate-700/50 text-slate-400">' + sp.replaceBy + '</span>';

    html += '<div class="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">';
    html += '<div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: ' + (sp.replaceBy === 'ASAP' ? 'rgba(239,68,68,0.1)' : 'rgba(30,41,59,0.5)') + '"><i class="fas ' + icon + ' ' + iconColor + ' text-xs"></i></div>';
    html += '<div><p class="text-sm font-medium text-white">' + sp.part + '</p><p class="text-xs text-slate-400">' + sp.machine + ' • ' + sp.cost + '</p></div></div>';
    html += '<div class="flex items-center gap-2">' + replaceBadge + '<span class="px-2 py-1 rounded text-xs ' + sp.statusClass + '">' + sp.status + '</span></div>';
    html += '</div>';
  });
  container.innerHTML = html;
}

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

function renderTerms() {
  const container = document.getElementById('termsGrid');
  if (!container) return;
  let html = '';
  appState.terms.forEach(t => {
    html += '<div class="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">';
    html += '<div class="flex items-center gap-2 mb-2"><span class="w-6 h-6 rounded-full bg-neon-blue/10 text-neon-blue text-xs flex items-center justify-center font-bold">' + t.num + '</span><span class="text-sm font-semibold text-white">' + t.title + '</span></div>';
    html += '<p class="text-xs text-slate-400">' + t.desc + '</p>';
    html += '</div>';
  });
  container.innerHTML = html;
}

function renderInsights() {
  const container = document.getElementById('insightsGrid');
  if (!container) return;
  let html = '';
  appState.insights.forEach(i => {
    html += '<div class="p-5 rounded-xl border" style="background: linear-gradient(to bottom right, ' + (i.color === 'text-neon-blue' ? 'rgba(0,212,255,0.03)' : i.color === 'text-neon-purple' ? 'rgba(168,85,247,0.03)' : i.color === 'text-neon-amber' ? 'rgba(245,158,11,0.03)' : i.color === 'text-neon-green' ? 'rgba(34,197,94,0.03)' : i.color === 'text-neon-red' ? 'rgba(239,68,68,0.03)' : 'rgba(100,116,139,0.03)') + ', transparent); border-color: ' + (i.color === 'text-neon-blue' ? 'rgba(0,212,255,0.1)' : i.color === 'text-neon-purple' ? 'rgba(168,85,247,0.1)' : i.color === 'text-neon-amber' ? 'rgba(245,158,11,0.1)' : i.color === 'text-neon-green' ? 'rgba(34,197,94,0.1)' : i.color === 'text-neon-red' ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)') + ';">';
    html += '<div class="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style="background: ' + (i.color === 'text-neon-blue' ? 'rgba(0,212,255,0.1)' : i.color === 'text-neon-purple' ? 'rgba(168,85,247,0.1)' : i.color === 'text-neon-amber' ? 'rgba(245,158,11,0.1)' : i.color === 'text-neon-green' ? 'rgba(34,197,94,0.1)' : i.color === 'text-neon-red' ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)') + '"><i class="fas ' + i.icon + ' ' + i.color + ' text-lg"></i></div>';
    html += '<h4 class="font-semibold text-white mb-2">' + i.title + '</h4>';
    html += '<p class="text-xs text-slate-400 leading-relaxed">' + i.text + '</p>';
    html += '</div>';
  });
  container.innerHTML = html;
}

// ===================== CALENDAR MODAL =====================
function openCalendar() {
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

function closeCalendar() { closeModalA11y('calendarModal'); }

// ===================== LASER PARAM EDIT MODAL =====================
function openLaserParamModal() {
  renderLaserParamEditList();
  openModalA11y('laserParamModal');
}

function closeLaserParamModal() { closeModalA11y('laserParamModal'); }

function renderLaserParamEditList() {
  const container = document.getElementById('laserParamEditList');
  let html = '';
  appState.laserParams.forEach((p, idx) => {
    html += '<div class="param-edit-row">';
    html += '<input type="text" class="param-edit-input" value="' + p.param + '" id="lp-param-' + idx + '" placeholder="Parameter name">';
    html += '<input type="text" class="param-edit-input" value="' + p.before + '" id="lp-before-' + idx + '" placeholder="Before">';
    html += '<input type="text" class="param-edit-input" value="' + p.after + '" id="lp-after-' + idx + '" placeholder="After">';
    html += '<input type="text" class="param-edit-input" value="' + p.target + '" id="lp-target-' + idx + '" placeholder="Target">';
    html += '<select class="param-edit-select" id="lp-status-' + idx + '">';
    html += '<option value="Pass" ' + (p.status === 'Pass' ? 'selected' : '') + '>Pass</option>';
    html += '<option value="Fail" ' + (p.status === 'Fail' ? 'selected' : '') + '>Fail</option>';
    html += '<option value="Warning" ' + (p.status === 'Warning' ? 'selected' : '') + '>Warning</option>';
    html += '</select>';
    html += '<button onclick="removeLaserParam(' + idx + ')" class="btn-sm btn-danger"><i class="fas fa-trash"></i></button>';
    html += '</div>';
    html += '<div class="param-edit-row" style="grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr 1fr; padding-top: 0; border-bottom: 1px solid rgba(255,255,255,0.04);">';
    html += '<input type="text" class="param-edit-input" value="' + (p.specRange || '') + '" id="lp-spec-' + idx + '" placeholder="Spec range" style="font-size: 11px;">';
    html += '<input type="text" class="param-edit-input" value="' + (p.measureAt || '') + '" id="lp-measure-' + idx + '" placeholder="Measure @ location" style="font-size: 11px;">';
    html += '<input type="date" class="param-edit-input" value="' + (p.beforeDate || '') + '" id="lp-bdate-' + idx + '" style="font-size: 11px;">';
    html += '<input type="date" class="param-edit-input" value="' + (p.afterDate || '') + '" id="lp-adate-' + idx + '" style="font-size: 11px;">';
    html += '<span class="text-[10px] text-slate-500 self-center">Before / After dates</span>';
    html += '<span></span>';
    html += '</div>';
  });
  container.innerHTML = html;
}

function addLaserParam() {
  const newId = appState.laserParams.length > 0 ? Math.max(...appState.laserParams.map(p => p.id)) + 1 : 1;
  appState.laserParams.push({
    id: newId,
    param: 'New Parameter',
    before: '-',
    after: '-',
    target: '-',
    status: 'Pass',
    icon: 'fa-circle',
    color: 'text-slate-400'
  });
  renderLaserParamEditList();
}

function removeLaserParam(idx) {
  appState.laserParams.splice(idx, 1);
  renderLaserParamEditList();
}

function saveLaserParams() {
  const newParams = [];
  appState.laserParams.forEach((p, idx) => {
    const param = document.getElementById('lp-param-' + idx)?.value || p.param;
    const before = document.getElementById('lp-before-' + idx)?.value || p.before;
    const after = document.getElementById('lp-after-' + idx)?.value || p.after;
    const target = document.getElementById('lp-target-' + idx)?.value || p.target;
    const status = document.getElementById('lp-status-' + idx)?.value || p.status;
    const specRange = document.getElementById('lp-spec-' + idx)?.value || p.specRange;
    const measureAt = document.getElementById('lp-measure-' + idx)?.value || p.measureAt;
    const beforeDate = document.getElementById('lp-bdate-' + idx)?.value || p.beforeDate;
    const afterDate = document.getElementById('lp-adate-' + idx)?.value || p.afterDate;
    newParams.push({ ...p, param, before, after, target, status, specRange, measureAt, beforeDate, afterDate });
  });
  appState.laserParams = newParams;
  renderParams();
  addChangeLogEntry({ action: 'update', machine: 'WLVIA #1', field: 'Laser Parameters', before: 'Edited', after: 'Saved (' + newParams.length + ' params)' });
  closeLaserParamModal();
}

// ===================== SPARE PARTS EDIT MODAL =====================
function openSparePartsModal() {
  renderSparePartsEditList();
  openModalA11y('sparePartsModal');
}

function closeSparePartsModal() { closeModalA11y('sparePartsModal'); }

function renderSparePartsEditList() {
  const container = document.getElementById('sparePartsEditList');
  let html = '';
  appState.spareParts.forEach((sp, idx) => {
    html += '<div class="spare-edit-row">';
    html += '<input type="text" class="spare-edit-input" value="' + sp.part + '" id="sp-part-' + idx + '" placeholder="Part name">';
    html += '<input type="text" class="spare-edit-input" value="' + sp.machine + '" id="sp-machine-' + idx + '" placeholder="Machine">';
    html += '<input type="text" class="spare-edit-input" value="' + sp.cost + '" id="sp-cost-' + idx + '" placeholder="Cost">';
    html += '<select class="spare-edit-select" id="sp-replace-' + idx + '">';
    html += '<option value="ASAP" ' + (sp.replaceBy === 'ASAP' ? 'selected' : '') + '>ASAP</option>';
    html += '<option value="Next quarter" ' + (sp.replaceBy === 'Next quarter' ? 'selected' : '') + '>Next quarter</option>';
    html += '<option value="N/A" ' + (sp.replaceBy === 'N/A' ? 'selected' : '') + '>N/A</option>';
    html += '</select>';
    html += '<select class="spare-edit-select" id="sp-status-' + idx + '">';
    html += '<option value="Monitor" ' + (sp.status === 'Monitor' ? 'selected' : '') + '>Monitor</option>';
    html += '<option value="Plan Order" ' + (sp.status === 'Plan Order' ? 'selected' : '') + '>Plan Order</option>';
    html += '<option value="OK" ' + (sp.status === 'OK' ? 'selected' : '') + '>OK</option>';
    html += '<option value="Critical" ' + (sp.status === 'Critical' ? 'selected' : '') + '>Critical</option>';
    html += '</select>';
    html += '<button onclick="removeSparePart(' + idx + ')" class="btn-sm btn-danger"><i class="fas fa-trash"></i></button>';
    html += '</div>';
  });
  container.innerHTML = html;
}

function addSparePart() {
  const newId = appState.spareParts.length > 0 ? Math.max(...appState.spareParts.map(p => p.id)) + 1 : 1;
  appState.spareParts.push({
    id: newId,
    part: 'New Part',
    machine: 'WLVIA #1',
    cost: '$0',
    replaceBy: 'Next quarter',
    status: 'Monitor',
    statusClass: 'bg-neon-green/10 text-neon-green border-neon-green/20'
  });
  renderSparePartsEditList();
}

function removeSparePart(idx) {
  appState.spareParts.splice(idx, 1);
  renderSparePartsEditList();
}

function saveSpareParts() {
  const newParts = [];
  appState.spareParts.forEach((sp, idx) => {
    const part = document.getElementById('sp-part-' + idx)?.value || sp.part;
    const machine = document.getElementById('sp-machine-' + idx)?.value || sp.machine;
    const cost = document.getElementById('sp-cost-' + idx)?.value || sp.cost;
    const replaceBy = document.getElementById('sp-replace-' + idx)?.value || sp.replaceBy;
    const status = document.getElementById('sp-status-' + idx)?.value || sp.status;

    let statusClass = 'bg-slate-700/50 text-slate-400 border-slate-600';
    if (status === 'Monitor') statusClass = 'bg-neon-green/10 text-neon-green border-neon-green/20';
    else if (status === 'Plan Order') statusClass = 'bg-neon-amber/10 text-neon-amber border-neon-amber/20';
    else if (status === 'OK') statusClass = 'bg-neon-blue/10 text-neon-blue border-neon-blue/20';
    else if (status === 'Critical') statusClass = 'bg-neon-red/10 text-neon-red border-neon-red/20';

    newParts.push({ ...sp, part, machine, cost, replaceBy, status, statusClass });
  });
  appState.spareParts = newParts;
  renderSpareParts();
  renderAlerts();
  addChangeLogEntry({ action: 'update', machine: 'Fleet', field: 'Spare Parts', before: 'Edited', after: 'Saved (' + newParts.length + ' parts)' });
  closeSparePartsModal();
}


// ===================== LASER POWER MONITOR FUNCTIONS =====================
function renderLaserPowerMonitor() {
  const container = document.getElementById('laserPowerGrid');
  if (!container) return;
  let html = '';
  ['laser1', 'laser2'].forEach(laserKey => {
    const laser = appState.laserPowerMonitor[laserKey];
    html += '<div class="glass rounded-xl p-5 border border-slate-700/50">';
    html += '<div class="flex items-center justify-between mb-4">';
    html += '<div class="flex items-center gap-3">';
    html += '<div class="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">';
    html += '<i class="fas fa-bolt text-white"></i></div>';
    html += '<div><h3 class="font-semibold text-white">' + laser.name + '</h3>';
    html += '<p class="text-xs text-slate-400 font-mono">' + laser.serial + ' • ' + laser.wavelength + '</p></div></div>';
    html += '<span class="px-2 py-1 rounded text-xs bg-neon-blue/10 text-neon-blue border border-neon-blue/20">6 Masks</span></div>';
    html += '<div class="space-y-2">';
    laser.masks.forEach(mask => {
      const statusColor = mask.status === 'Pass' ? 'text-neon-green' : 'text-neon-red';
      const statusBg = mask.status === 'Pass' ? 'bg-neon-green/10' : 'bg-neon-red/10';
      const barColor = mask.status === 'Pass' ? 'bg-neon-green' : 'bg-neon-red';
      const pct = ((mask.afterPower - mask.specMin) / (mask.specMax - mask.specMin) * 100).toFixed(0);
      html += '<div class="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">';
      html += '<div class="flex items-center justify-between mb-2">';
      html += '<div class="flex items-center gap-2"><span class="w-6 h-6 rounded-md bg-slate-700 flex items-center justify-center text-xs font-mono text-slate-300">' + mask.idx + '</span>';
      html += '<span class="text-sm text-white">Aperture ' + mask.aperture + '</span></div>';
      html += '<span class="px-2 py-0.5 rounded text-xs ' + statusBg + ' ' + statusColor + ' border ' + (mask.status === 'Pass' ? 'border-neon-green/20' : 'border-neon-red/20') + '">' + mask.status + '</span></div>';
      html += '<div class="flex items-center gap-3 mb-2">';
      html += '<div class="text-center flex-1"><p class="text-[10px] text-slate-500">Before</p><p class="text-sm font-bold text-slate-400">' + mask.beforePower + 'W</p></div>';
      html += '<i class="fas fa-arrow-right text-xs text-slate-600"></i>';
      html += '<div class="text-center flex-1"><p class="text-[10px] text-slate-500">After</p><p class="text-sm font-bold ' + statusColor + '">' + mask.afterPower + 'W</p></div>';
      html += '<div class="text-center flex-1"><p class="text-[10px] text-slate-500">Spec</p><p class="text-sm font-bold text-neon-blue">' + mask.specMin + '-' + mask.specMax + 'W</p></div></div>';
      html += '<div class="w-full bg-slate-700 rounded-full h-1.5"><div class="' + barColor + ' h-1.5 rounded-full transition-all" style="width: ' + Math.min(Math.max(pct, 0), 100) + '%"></div></div>';
      html += '</div>';
    });
    html += '</div></div>';
  });
  container.innerHTML = html;
}

function openLaserPowerModal() {
  renderLaserPowerEdit();
  openModalA11y('laserPowerModal');
}
function closeLaserPowerModal() { closeModalA11y('laserPowerModal'); }
function renderLaserPowerEdit() {
  const container = document.getElementById('laserPowerEditContent');
  let html = '';
  ['laser1', 'laser2'].forEach((laserKey, li) => {
    const laser = appState.laserPowerMonitor[laserKey];
    html += '<div class="mb-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">';
    html += '<h3 class="text-sm font-bold text-white mb-3 flex items-center gap-2"><i class="fas fa-bolt text-neon-blue"></i> ' + laser.name + '</h3>';
    html += '<div class="grid grid-cols-6 gap-2 mb-2 text-xs text-slate-400 font-medium"><span>Mask</span><span>Aperture</span><span>Before (W)</span><span>After (W)</span><span>Spec Min</span><span>Spec Max</span></div>';
    laser.masks.forEach((mask, mi) => {
      const prefix = 'lpm-' + laserKey + '-' + mi;
      html += '<div class="grid grid-cols-6 gap-2 mb-2">';
      html += '<input type="text" class="param-edit-input" value="' + mask.idx + '" id="' + prefix + '-idx" readonly style="background:rgba(30,41,59,0.4);">';
      html += '<input type="text" class="param-edit-input" value="' + mask.aperture + '" id="' + prefix + '-aperture">';
      html += '<input type="number" class="param-edit-input" value="' + mask.beforePower + '" id="' + prefix + '-before" step="0.1">';
      html += '<input type="number" class="param-edit-input" value="' + mask.afterPower + '" id="' + prefix + '-after" step="0.1">';
      html += '<input type="number" class="param-edit-input" value="' + mask.specMin + '" id="' + prefix + '-min" step="0.1">';
      html += '<input type="number" class="param-edit-input" value="' + mask.specMax + '" id="' + prefix + '-max" step="0.1">';
      html += '</div>';
    });
    html += '</div>';
  });
  container.innerHTML = html;
}
function saveLaserPowerData() {
  ['laser1', 'laser2'].forEach((laserKey, li) => {
    const laser = appState.laserPowerMonitor[laserKey];
    laser.masks.forEach((mask, mi) => {
      const prefix = 'lpm-' + laserKey + '-' + mi;
      mask.aperture = document.getElementById(prefix + '-aperture').value;
      mask.beforePower = parseFloat(document.getElementById(prefix + '-before').value) || 0;
      mask.afterPower = parseFloat(document.getElementById(prefix + '-after').value) || 0;
      mask.specMin = parseFloat(document.getElementById(prefix + '-min').value) || 0;
      mask.specMax = parseFloat(document.getElementById(prefix + '-max').value) || 0;
      mask.status = (mask.afterPower >= mask.specMin && mask.afterPower <= mask.specMax) ? 'Pass' : 'Fail';
    });
  });
  renderLaserPowerMonitor();
  addChangeLogEntry({ action: 'update', machine: 'Laser Sources', field: 'Laser Power Monitor', before: 'Edited', after: 'Saved' });
  closeLaserPowerModal();
}

// ===================== LASER PROFILE MONITOR FUNCTIONS =====================
function renderLaserProfileMonitor() {
  const container = document.getElementById('laserProfileGrid');
  if (!container) return;
  const lp = appState.laserProfile;
  // Format power with up to 3 decimal places, removing trailing zeros
  const fmt = (v) => {
    if (v === null || v === undefined || v === '') return '0';
    const n = parseFloat(v);
    if (isNaN(n)) return '0';
    if (n === 0) return '0';
    if (Math.abs(n) < 0.001) return n.toFixed(4);
    if (Math.abs(n) < 0.01) return n.toFixed(3);
    if (Math.abs(n) < 1) return n.toFixed(2);
    if (Math.abs(n) < 10) return n.toFixed(1);
    return n.toFixed(1);
  };
  let html = '<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">';
  // Product info card
  html += '<div class="glass rounded-xl p-5 border border-slate-700/50 lg:col-span-3">';
  html += '<div class="flex items-center gap-3 mb-4">';
  html += '<div class="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-purple to-pink-500 flex items-center justify-center"><i class="fas fa-microchip text-white"></i></div>';
  html += '<div><h3 class="font-semibold text-white">Current Running Product</h3><p class="text-xs text-slate-400">Active production configuration</p></div></div>';
  html += '<div class="grid grid-cols-2 md:grid-cols-4 gap-4">';
  html += '<div class="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-center"><p class="text-[10px] text-slate-500 uppercase">Product</p><p class="text-sm font-bold text-neon-purple font-mono">' + lp.productName + '</p></div>';
  html += '<div class="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-center"><p class="text-[10px] text-slate-500 uppercase">Wafer Size</p><p class="text-sm font-bold text-white font-mono">' + lp.waferSize + '</p></div>';
  html += '<div class="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-center"><p class="text-[10px] text-slate-500 uppercase">Aperture</p><p class="text-sm font-bold text-neon-amber font-mono">' + lp.laser1.aperture + '</p></div>';
  html += '<div class="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-center"><p class="text-[10px] text-slate-500 uppercase">Mask Index</p><p class="text-sm font-bold text-neon-blue font-mono">#' + lp.laser1.maskIndex + '</p></div>';
  html += '</div></div>';
  // Laser 1
  html += '<div class="glass rounded-xl p-5 border border-neon-blue/20">';
  html += '<div class="flex items-center gap-2 mb-4"><div class="w-8 h-8 rounded-lg bg-neon-blue/20 flex items-center justify-center"><i class="fas fa-bolt text-neon-blue"></i></div><h3 class="font-semibold text-white">Laser Source 1</h3></div>';
  html += '<div class="space-y-3">';
  html += '<div class="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30"><p class="text-[10px] text-slate-500 uppercase mb-1">Power Phase 1</p><p class="text-lg font-bold text-neon-blue font-mono">' + fmt(lp.laser1.powerPhase1) + ' <span class="text-xs text-slate-400">W</span></p></div>';
  html += '<div class="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30"><p class="text-[10px] text-slate-500 uppercase mb-1">Power Phase 2</p><p class="text-lg font-bold text-neon-purple font-mono">' + fmt(lp.laser1.powerPhase2) + ' <span class="text-xs text-slate-400">W</span></p></div>';
  html += '<div class="grid grid-cols-2 gap-2">';
  html += '<div class="p-2 rounded-lg bg-slate-800/30 border border-slate-700/30 text-center"><p class="text-[9px] text-slate-500">Shots P1</p><p class="text-sm font-bold text-slate-300 font-mono">' + lp.laser1.shotsPhase1.toLocaleString() + '</p></div>';
  html += '<div class="p-2 rounded-lg bg-slate-800/30 border border-slate-700/30 text-center"><p class="text-[9px] text-slate-500">Shots P2</p><p class="text-sm font-bold text-slate-300 font-mono">' + lp.laser1.shotsPhase2.toLocaleString() + '</p></div>';
  html += '</div>';
  html += '<div class="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30"><p class="text-[10px] text-slate-500 uppercase mb-1">Frequency</p><p class="text-lg font-bold text-neon-amber font-mono">' + lp.laser1.frequency + ' <span class="text-xs text-slate-400">kHz</span></p></div>';
  html += '</div></div>';
  // Laser 2
  html += '<div class="glass rounded-xl p-5 border border-neon-purple/20">';
  html += '<div class="flex items-center gap-2 mb-4"><div class="w-8 h-8 rounded-lg bg-neon-purple/20 flex items-center justify-center"><i class="fas fa-bolt text-neon-purple"></i></div><h3 class="font-semibold text-white">Laser Source 2</h3></div>';
  html += '<div class="space-y-3">';
  html += '<div class="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30"><p class="text-[10px] text-slate-500 uppercase mb-1">Power Phase 1</p><p class="text-lg font-bold text-neon-blue font-mono">' + fmt(lp.laser2.powerPhase1) + ' <span class="text-xs text-slate-400">W</span></p></div>';
  html += '<div class="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30"><p class="text-[10px] text-slate-500 uppercase mb-1">Power Phase 2</p><p class="text-lg font-bold text-neon-purple font-mono">' + fmt(lp.laser2.powerPhase2) + ' <span class="text-xs text-slate-400">W</span></p></div>';
  html += '<div class="grid grid-cols-2 gap-2">';
  html += '<div class="p-2 rounded-lg bg-slate-800/30 border border-slate-700/30 text-center"><p class="text-[9px] text-slate-500">Shots P1</p><p class="text-sm font-bold text-slate-300 font-mono">' + lp.laser2.shotsPhase1.toLocaleString() + '</p></div>';
  html += '<div class="p-2 rounded-lg bg-slate-800/30 border border-slate-700/30 text-center"><p class="text-[9px] text-slate-500">Shots P2</p><p class="text-sm font-bold text-slate-300 font-mono">' + lp.laser2.shotsPhase2.toLocaleString() + '</p></div>';
  html += '</div>';
  html += '<div class="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30"><p class="text-[10px] text-slate-500 uppercase mb-1">Frequency</p><p class="text-lg font-bold text-neon-amber font-mono">' + lp.laser2.frequency + ' <span class="text-xs text-slate-400">kHz</span></p></div>';
  html += '</div></div>';
  // Comparison chart
  html += '<div class="glass rounded-xl p-5 border border-slate-700/50">';
  html += '<h3 class="font-semibold text-white mb-4 text-sm">Power Comparison</h3>';
  html += '<div class="space-y-3">';
  html += '<div class="flex items-center gap-3"><span class="text-xs text-slate-400 w-20">Phase 1</span><div class="flex-1 bg-slate-700 rounded-full h-3"><div class="bg-neon-blue h-3 rounded-full" style="width:' + Math.min((parseFloat(lp.laser1.powerPhase1)||0)/20*100,100) + '%"></div></div><span class="text-xs text-neon-blue font-mono w-12 text-right">L1:' + fmt(lp.laser1.powerPhase1) + 'W</span></div>';
  html += '<div class="flex items-center gap-3"><span class="text-xs text-slate-400 w-20">Phase 1</span><div class="flex-1 bg-slate-700 rounded-full h-3"><div class="bg-neon-purple h-3 rounded-full" style="width:' + Math.min((parseFloat(lp.laser2.powerPhase1)||0)/20*100,100) + '%"></div></div><span class="text-xs text-neon-purple font-mono w-12 text-right">L2:' + fmt(lp.laser2.powerPhase1) + 'W</span></div>';
  html += '<div class="flex items-center gap-3"><span class="text-xs text-slate-400 w-20">Phase 2</span><div class="flex-1 bg-slate-700 rounded-full h-3"><div class="bg-neon-blue h-3 rounded-full" style="width:' + Math.min((parseFloat(lp.laser1.powerPhase2)||0)/20*100,100) + '%"></div></div><span class="text-xs text-neon-blue font-mono w-12 text-right">L1:' + fmt(lp.laser1.powerPhase2) + 'W</span></div>';
  html += '<div class="flex items-center gap-3"><span class="text-xs text-slate-400 w-20">Phase 2</span><div class="flex-1 bg-slate-700 rounded-full h-3"><div class="bg-neon-purple h-3 rounded-full" style="width:' + Math.min((parseFloat(lp.laser2.powerPhase2)||0)/20*100,100) + '%"></div></div><span class="text-xs text-neon-purple font-mono w-12 text-right">L2:' + fmt(lp.laser2.powerPhase2) + 'W</span></div>';
  html += '</div></div>';
  html += '</div>';
  container.innerHTML = html;
}

function openLaserProfileModal() {
  renderLaserProfileEdit();
  openModalA11y('laserProfileModal');
}
function closeLaserProfileModal() { closeModalA11y('laserProfileModal'); }
function renderLaserProfileEdit() {
  const container = document.getElementById('laserProfileEditContent');
  const lp = appState.laserProfile;
  let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
  html += '<div><span class="edit-label">Product Name</span><input type="text" class="edit-input" id="lpf-product" value="' + lp.productName + '"></div>';
  html += '<div><span class="edit-label">Wafer Size</span><input type="text" class="edit-input" id="lpf-wafer" value="' + lp.waferSize + '"></div>';
  html += '</div>';
  html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">';
  // Laser 1
  html += '<div class="p-4 rounded-xl bg-slate-800/30 border border-neon-blue/20">';
  html += '<h3 class="text-sm font-bold text-neon-blue mb-3">Laser Source 1</h3>';
  html += '<div class="grid grid-cols-2 gap-3">';
  html += '<div><span class="edit-label">Power Phase 1 (W)</span><input type="number" class="edit-input" id="lpf-l1p1" value="' + lp.laser1.powerPhase1 + '" step="0.001"></div>';
  html += '<div><span class="edit-label">Power Phase 2 (W)</span><input type="number" class="edit-input" id="lpf-l1p2" value="' + lp.laser1.powerPhase2 + '" step="0.001"></div>';
  html += '<div><span class="edit-label">Shots Phase 1</span><input type="number" class="edit-input" id="lpf-l1s1" value="' + lp.laser1.shotsPhase1 + '"></div>';
  html += '<div><span class="edit-label">Shots Phase 2</span><input type="number" class="edit-input" id="lpf-l1s2" value="' + lp.laser1.shotsPhase2 + '"></div>';
  html += '<div><span class="edit-label">Aperture</span><input type="text" class="edit-input" id="lpf-l1ap" value="' + lp.laser1.aperture + '"></div>';
  html += '<div><span class="edit-label">Mask Index</span><input type="number" class="edit-input" id="lpf-l1mi" value="' + lp.laser1.maskIndex + '"></div>';
  html += '<div><span class="edit-label">Frequency (kHz)</span><input type="number" class="edit-input" id="lpf-l1fr" value="' + lp.laser1.frequency + '"></div>';
  html += '</div></div>';
  // Laser 2
  html += '<div class="p-4 rounded-xl bg-slate-800/30 border border-neon-purple/20">';
  html += '<h3 class="text-sm font-bold text-neon-purple mb-3">Laser Source 2</h3>';
  html += '<div class="grid grid-cols-2 gap-3">';
  html += '<div><span class="edit-label">Power Phase 1 (W)</span><input type="number" class="edit-input" id="lpf-l2p1" value="' + lp.laser2.powerPhase1 + '" step="0.001"></div>';
  html += '<div><span class="edit-label">Power Phase 2 (W)</span><input type="number" class="edit-input" id="lpf-l2p2" value="' + lp.laser2.powerPhase2 + '" step="0.001"></div>';
  html += '<div><span class="edit-label">Shots Phase 1</span><input type="number" class="edit-input" id="lpf-l2s1" value="' + lp.laser2.shotsPhase1 + '"></div>';
  html += '<div><span class="edit-label">Shots Phase 2</span><input type="number" class="edit-input" id="lpf-l2s2" value="' + lp.laser2.shotsPhase2 + '"></div>';
  html += '<div><span class="edit-label">Aperture</span><input type="text" class="edit-input" id="lpf-l2ap" value="' + lp.laser2.aperture + '"></div>';
  html += '<div><span class="edit-label">Mask Index</span><input type="number" class="edit-input" id="lpf-l2mi" value="' + lp.laser2.maskIndex + '"></div>';
  html += '<div><span class="edit-label">Frequency (kHz)</span><input type="number" class="edit-input" id="lpf-l2fr" value="' + lp.laser2.frequency + '"></div>';
  html += '</div></div>';
  html += '</div>';
  container.innerHTML = html;
}
function saveLaserProfileData() {
  const lp = appState.laserProfile;
  lp.productName = document.getElementById('lpf-product').value;
  lp.waferSize = document.getElementById('lpf-wafer').value;
  lp.laser1.powerPhase1 = parseFloat(document.getElementById('lpf-l1p1').value) || 0;
  lp.laser1.powerPhase2 = parseFloat(document.getElementById('lpf-l1p2').value) || 0;
  lp.laser1.shotsPhase1 = parseInt(document.getElementById('lpf-l1s1').value) || 0;
  lp.laser1.shotsPhase2 = parseInt(document.getElementById('lpf-l1s2').value) || 0;
  lp.laser1.aperture = document.getElementById('lpf-l1ap').value;
  lp.laser1.maskIndex = parseInt(document.getElementById('lpf-l1mi').value) || 1;
  lp.laser1.frequency = parseInt(document.getElementById('lpf-l1fr').value) || 80;
  lp.laser2.powerPhase1 = parseFloat(document.getElementById('lpf-l2p1').value) || 0;
  lp.laser2.powerPhase2 = parseFloat(document.getElementById('lpf-l2p2').value) || 0;
  lp.laser2.shotsPhase1 = parseInt(document.getElementById('lpf-l2s1').value) || 0;
  lp.laser2.shotsPhase2 = parseInt(document.getElementById('lpf-l2s2').value) || 0;
  lp.laser2.aperture = document.getElementById('lpf-l2ap').value;
  lp.laser2.maskIndex = parseInt(document.getElementById('lpf-l2mi').value) || 1;
  lp.laser2.frequency = parseInt(document.getElementById('lpf-l2fr').value) || 80;
  renderLaserProfileMonitor();
  addChangeLogEntry({ action: 'update', machine: appState.laserProfile.productName || 'Laser Profile', field: 'Laser Profile', before: 'Edited', after: 'Saved' });
  closeLaserProfileModal();
}

// ===================== VIA IMAGE COMPARISON FUNCTIONS =====================
function renderViaImageReport() {
  const container = document.getElementById('viaImageReport');
  if (!container) return;
  const vi = appState.viaImages;
  let html = '<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">';
  // Before images
  html += '<div class="glass rounded-xl p-5 border border-slate-700/50">';
  html += '<div class="flex items-center justify-between mb-3">';
  html += '<h3 class="font-semibold text-white flex items-center gap-2"><i class="fas fa-image text-slate-400"></i> Before (' + vi.beforeImgs.length + ')</h3>';
  html += '<span class="text-xs text-slate-500 font-mono">' + vi.beforeDate + '</span></div>';
  if (vi.beforeImgs.length > 0) {
    html += '<div class="grid grid-cols-2 gap-2 mb-3">';
    vi.beforeImgs.forEach((img, idx) => {
      html += '<div class="rounded-lg overflow-hidden cursor-pointer relative group" onclick="openViaImageModal()">';
      html += '<img src="' + img + '" style="width:100%; height:140px; object-fit:cover;">';
      html += '<div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"></div>';
      html += '</div>';
    });
    html += '</div>';
  } else {
    html += '<div class="grid grid-cols-2 gap-2 mb-3">';
    html += '<div class="rounded-lg bg-slate-800/50 flex items-center justify-center" style="height:140px;"><span class="text-xs text-slate-600">No image</span></div>';
    html += '<div class="rounded-lg bg-slate-800/50 flex items-center justify-center" style="height:140px;"><span class="text-xs text-slate-600">No image</span></div>';
    html += '</div>';
  }
  html += '<button onclick="openViaImageModal()" class="w-full py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 text-xs hover:bg-slate-700/50 hover:text-white transition-all flex items-center justify-center gap-2">';
  html += '<i class="fas fa-edit"></i> Edit before images</button>';
  html += '</div>';
  // After images
  html += '<div class="glass rounded-xl p-5 border border-neon-green/20">';
  html += '<div class="flex items-center justify-between mb-3">';
  html += '<h3 class="font-semibold text-white flex items-center gap-2"><i class="fas fa-image text-neon-green"></i> After (' + vi.afterImgs.length + ')</h3>';
  html += '<span class="text-xs text-slate-500 font-mono">' + vi.afterDate + '</span></div>';
  if (vi.afterImgs.length > 0) {
    html += '<div class="grid grid-cols-2 gap-2 mb-3">';
    vi.afterImgs.forEach((img, idx) => {
      html += '<div class="rounded-lg overflow-hidden cursor-pointer relative group" onclick="openViaImageModal()">';
      html += '<img src="' + img + '" style="width:100%; height:140px; object-fit:cover;">';
      html += '<div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"></div>';
      html += '</div>';
    });
    html += '</div>';
  } else {
    html += '<div class="grid grid-cols-2 gap-2 mb-3">';
    html += '<div class="rounded-lg bg-slate-800/50 flex items-center justify-center" style="height:140px;"><span class="text-xs text-slate-600">No image</span></div>';
    html += '<div class="rounded-lg bg-slate-800/50 flex items-center justify-center" style="height:140px;"><span class="text-xs text-slate-600">No image</span></div>';
    html += '</div>';
  }
  html += '<button onclick="openViaImageModal()" class="w-full py-2 rounded-lg bg-neon-green/5 border border-neon-green/20 text-neon-green text-xs hover:bg-neon-green/10 transition-all flex items-center justify-center gap-2">';
  html += '<i class="fas fa-edit"></i> Edit after images</button>';
  html += '</div>';
  html += '</div>';
  // Metrics
  html += '<div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">';
  const metrics = [
    { label: 'Top Diameter', before: vi.topDiameter.before, after: vi.topDiameter.after, spec: vi.topDiameter.spec, icon: 'fa-ruler' },
    { label: 'Bottom Diameter', before: vi.bottomDiameter.before, after: vi.bottomDiameter.after, spec: vi.bottomDiameter.spec, icon: 'fa-circle' },
    { label: 'Roundness', before: vi.roundness.before, after: vi.roundness.after, spec: vi.roundness.spec, icon: 'fa-bullseye' },
  ];
  metrics.forEach(m => {
    html += '<div class="glass rounded-xl p-4 border border-slate-700/50">';
    html += '<div class="flex items-center gap-2 mb-2"><i class="fas ' + m.icon + ' text-neon-amber"></i><span class="text-xs text-slate-400">' + m.label + '</span></div>';
    html += '<div class="flex items-center gap-2 mb-1">';
    html += '<span class="text-sm font-bold text-slate-500">' + m.before + '</span>';
    html += '<i class="fas fa-arrow-right text-xs text-slate-600"></i>';
    html += '<span class="text-sm font-bold text-neon-green">' + m.after + '</span>';
    html += '</div>';
    html += '<p class="text-[10px] text-slate-500">Spec: ' + m.spec + '</p>';
    html += '</div>';
  });
  html += '</div>';
  // Notes
  if (vi.notes) {
    html += '<div class="mt-4 p-4 rounded-lg bg-neon-amber/5 border border-neon-amber/10">';
    html += '<p class="text-xs text-slate-400"><i class="fas fa-sticky-note text-neon-amber mr-1"></i> ' + vi.notes + '</p>';
    html += '</div>';
  }
  container.innerHTML = html;
}

function openViaImageModal() {
  renderViaImageEdit();
  openModalA11y('viaImageModal');
}
function closeViaImageModal() { closeModalA11y('viaImageModal'); }
function renderViaImageEdit() {
  const container = document.getElementById('viaImageEditContent');
  const vi = appState.viaImages;
  let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
  html += '<div><span class="edit-label">Before Date</span><input type="date" class="edit-input" id="vi-bdate" value="' + vi.beforeDate + '"></div>';
  html += '<div><span class="edit-label">After Date</span><input type="date" class="edit-input" id="vi-adate" value="' + vi.afterDate + '"></div>';
  html += '</div>';
  html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">';
  html += '<div><span class="edit-label">Before Image</span>';
  html += '<div class="image-upload-slot" onclick="document.getElementById(\'vi-bimg\').click()" id="vi-bslot" style="min-height:160px;">';
  if (vi.beforeImg) {
    html += '<img src="' + vi.beforeImg + '" style="max-height:140px; border-radius:6px;">';
  } else {
    html += '<i class="fas fa-camera text-slate-500 text-2xl mb-2"></i><p class="text-xs text-slate-400">Click to upload before image</p>';
  }
  html += '<input type="file" id="vi-bimg" accept="image/*" style="display:none" onchange="handleViaImage(this,\'before\')">';
  html += '</div></div>';
  html += '<div><span class="edit-label">After Image</span>';
  html += '<div class="image-upload-slot" onclick="document.getElementById(\'vi-aimg\').click()" id="vi-aslot" style="min-height:160px;">';
  if (vi.afterImg) {
    html += '<img src="' + vi.afterImg + '" style="max-height:140px; border-radius:6px;">';
  } else {
    html += '<i class="fas fa-camera text-slate-500 text-2xl mb-2"></i><p class="text-xs text-slate-400">Click to upload after image</p>';
  }
  html += '<input type="file" id="vi-aimg" accept="image/*" style="display:none" onchange="handleViaImage(this,\'after\')">';
  html += '</div></div>';
  html += '</div>';
  html += '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">';
  html += '<div><span class="edit-label">Top Diameter Before</span><input type="text" class="edit-input" id="vi-vsb" value="' + vi.topDiameter.before + '"></div>';
  html += '<div><span class="edit-label">Top Diameter After</span><input type="text" class="edit-input" id="vi-vsa" value="' + vi.topDiameter.after + '"></div>';
  html += '<div><span class="edit-label">Top Diameter Spec</span><input type="text" class="edit-input" id="vi-vss" value="' + vi.topDiameter.spec + '"></div>';
  html += '<div></div>';
  html += '<div><span class="edit-label">Bottom Diameter Before</span><input type="text" class="edit-input" id="vi-vdb" value="' + vi.bottomDiameter.before + '"></div>';
  html += '<div><span class="edit-label">Bottom Diameter After</span><input type="text" class="edit-input" id="vi-vda" value="' + vi.bottomDiameter.after + '"></div>';
  html += '<div><span class="edit-label">Bottom Diameter Spec</span><input type="text" class="edit-input" id="vi-vds" value="' + vi.bottomDiameter.spec + '"></div>';
  html += '<div></div>';
  html += '<div><span class="edit-label">Shape Before</span><input type="text" class="edit-input" id="vi-shb" value="' + vi.shape.before + '"></div>';
  html += '<div><span class="edit-label">Shape After</span><input type="text" class="edit-input" id="vi-sha" value="' + vi.shape.after + '"></div>';
  html += '<div><span class="edit-label">Shape Spec</span><input type="text" class="edit-input" id="vi-shs" value="' + vi.shape.spec + '"></div>';
  html += '<div></div>';
  html += '<div><span class="edit-label">Roundness Before</span><input type="text" class="edit-input" id="vi-rnb" value="' + vi.roundness.before + '"></div>';
  html += '<div><span class="edit-label">Roundness After</span><input type="text" class="edit-input" id="vi-rna" value="' + vi.roundness.after + '"></div>';
  html += '<div><span class="edit-label">Roundness Spec</span><input type="text" class="edit-input" id="vi-rns" value="' + vi.roundness.spec + '"></div>';
  html += '</div>';
  html += '<div class="mt-4"><span class="edit-label">Notes</span><textarea class="edit-textarea" id="vi-notes" rows="2">' + vi.notes + '</textarea></div>';
  container.innerHTML = html;
}
async function handleViaImage(input, type) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { alert('Image too large (max 5MB).'); input.value = ''; return; }
  try {
    const idx = appState.viaImages[type + 'Imgs'].length;
    const objectUrl = await uploadAndStoreImage(file, 'via-' + type + '-' + idx);
    appState.viaImages[type + 'Imgs'].push(objectUrl);
    renderViaImageEdit();
  } catch (e) {
    console.error('Via image upload failed', e);
  }
}
function addViaImage(type) {
  const inputId = type === 'before' ? 'vi-bimg-add' : 'vi-aimg-add';
  document.getElementById(inputId).click();
}
function removeViaImage(idx, type) {
  appState.viaImages[type + 'Imgs'].splice(idx, 1);
  renderViaImageEdit();
}

function saveViaImageData() {
  const vi = appState.viaImages;
  vi.beforeDate = document.getElementById('vi-bdate').value;
  vi.afterDate = document.getElementById('vi-adate').value;
  vi.topDiameter.before = document.getElementById('vi-vsb').value;
  vi.topDiameter.after = document.getElementById('vi-vsa').value;
  vi.topDiameter.spec = document.getElementById('vi-vss').value;
  vi.bottomDiameter.before = document.getElementById('vi-vdb').value;
  vi.bottomDiameter.after = document.getElementById('vi-vda').value;
  vi.bottomDiameter.spec = document.getElementById('vi-vds').value;
  vi.roundness.before = document.getElementById('vi-rnb').value;
  vi.roundness.after = document.getElementById('vi-rna').value;
  vi.roundness.spec = document.getElementById('vi-rns').value;
  vi.shape.before = document.getElementById('vi-shb').value;
  vi.shape.after = document.getElementById('vi-sha').value;
  vi.shape.spec = document.getElementById('vi-shs').value;
  vi.notes = document.getElementById('vi-notes').value;
  renderViaImageReport();
  addChangeLogEntry({ action: 'update', machine: 'Via Images', field: 'Via Image Comparison', before: 'Edited', after: 'Saved' });
  closeViaImageModal();
}

// ===================== BEAM PROFILE MONITOR FUNCTIONS =====================
function renderBeamProfileReport() {
  const container = document.getElementById('beamProfileReport');
  if (!container) return;
  const bp = appState.beamProfiles;
  let html = '';
  ['laser1', 'laser2'].forEach(laserKey => {
    const laser = bp[laserKey];
    const laserNum = laserKey === 'laser1' ? '1' : '2';
    html += '<div class="mb-8">';
    html += '<div class="flex items-center gap-3 mb-4">';
    html += '<div class="w-10 h-10 rounded-lg bg-gradient-to-br from-' + (laserKey === 'laser1' ? 'neon-blue' : 'neon-purple') + ' to-' + (laserKey === 'laser1' ? 'blue-600' : 'purple-600') + ' flex items-center justify-center">';
    html += '<i class="fas fa-bullseye text-white"></i></div>';
    html += '<div><h3 class="font-semibold text-white">' + laser.title + ' — Beam Profiles</h3>';
    html += '<p class="text-xs text-slate-400">' + laser.items.length + ' Aperture Masks — Before vs After comparison</p></div></div>';
    html += '<div class="grid grid-cols-2 md:grid-cols-5 gap-3">';
    laser.items.forEach((mask, idx) => {
      const sizeOk = parseFloat(mask.beamSizeAfter) >= parseFloat(mask.specSize.split('-')[0]) && parseFloat(mask.beamSizeAfter) <= parseFloat(mask.specSize.split('-')[1]);
      const diaOk = parseFloat(mask.beamDiaAfter) >= parseFloat(mask.specDia.split('-')[0]) && parseFloat(mask.beamDiaAfter) <= parseFloat(mask.specDia.split('-')[1]);
      const statusColor = (sizeOk && diaOk) ? 'border-neon-green/30' : 'border-neon-red/30';
      const statusBg = (sizeOk && diaOk) ? 'bg-neon-green/5' : 'bg-neon-red/5';
      html += '<div class="glass rounded-xl p-3 border ' + statusColor + ' ' + statusBg + '">';
      html += '<p class="text-xs font-bold text-white mb-2">' + mask.title + '</p>';
      html += '<div class="grid grid-cols-2 gap-2 mb-2">';
      if (mask.beforeImg) {
        html += '<div class="rounded-lg overflow-hidden"><img src="' + mask.beforeImg + '" style="width:100%; height:60px; object-fit:cover;"></div>';
      } else {
        html += '<div class="rounded-lg bg-slate-800/50 flex items-center justify-center" style="height:60px;"><span class="text-[9px] text-slate-600">No img</span></div>';
      }
      if (mask.afterImg) {
        html += '<div class="rounded-lg overflow-hidden"><img src="' + mask.afterImg + '" style="width:100%; height:60px; object-fit:cover;"></div>';
      } else {
        html += '<div class="rounded-lg bg-slate-800/50 flex items-center justify-center" style="height:60px;"><span class="text-[9px] text-slate-600">No img</span></div>';
      }
      html += '</div>';
      html += '<div class="space-y-1">';
      html += '<div class="flex justify-between text-[10px]"><span class="text-slate-500">Size:</span><span class="text-slate-300">' + mask.beamSizeBefore + ' → <strong class="' + (sizeOk ? 'text-neon-green' : 'text-neon-red') + '">' + mask.beamSizeAfter + '</strong></span></div>';
      html += '<div class="flex justify-between text-[10px]"><span class="text-slate-500">Dia:</span><span class="text-slate-300">' + mask.beamDiaBefore + ' → <strong class="' + (diaOk ? 'text-neon-green' : 'text-neon-red') + '">' + mask.beamDiaAfter + '</strong></span></div>';
      html += '<div class="flex justify-between text-[9px]"><span class="text-slate-600">Spec:</span><span class="text-slate-500">' + mask.specSize + ' / ' + mask.specDia + '</span></div>';
      html += '</div></div>';
    });
    html += '</div></div>';
  });
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

function openBeamProfileModal() {
  renderBeamProfileEdit();
  openModalA11y('beamProfileModal');
}
function closeBeamProfileModal() { closeModalA11y('beamProfileModal'); }
function renderBeamProfileEdit() {
  const container = document.getElementById('beamProfileEditContent');
  const bp = appState.beamProfiles;
  let html = '';
  ['laser1', 'laser2'].forEach((laserKey, li) => {
    const laser = bp[laserKey];
    html += '<div class="mb-6 p-4 rounded-xl bg-slate-800/20 border border-slate-700/30">';
    html += '<div class="flex items-center justify-between mb-3">';
    html += '<div class="flex items-center gap-3 flex-1">';
    html += '<span class="text-xs text-slate-400">Laser Title:</span>';
    html += '<input type="text" class="edit-input" id="bp-title-' + laserKey + '" value="' + laser.title + '" style="max-width: 300px;">';
    html += '</div>';
    html += '<div class="flex items-center gap-2">';
    html += '<span class="text-xs text-slate-400">' + laser.items.length + ' items</span>';
    html += '<button onclick="addBeamItem(\'' + laserKey + '\')" class="btn-sm btn-add"><i class="fas fa-plus mr-1"></i> Add Mask</button>';
    html += '</div></div>';
    html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-3">';
    laser.items.forEach((mask, mi) => {
      const prefix = 'bp-' + laserKey + '-' + mi;
      html += '<div class="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 relative">';
      html += '<div class="flex items-center justify-between mb-2">';
      html += '<input type="text" class="param-edit-input" value="' + mask.title + '" id="' + prefix + '-title" placeholder="Item title" style="font-weight:700; color:white; background:transparent; border:none; padding:0; font-size:12px;">';
      html += '<button onclick="removeBeamItem(\'' + laserKey + '\', ' + mi + ')" class="btn-sm btn-danger" title="Delete this item"><i class="fas fa-trash"></i></button>';
      html += '</div>';
      html += '<div class="grid grid-cols-2 gap-2 mb-2">';
      html += `<div class="image-upload-slot" onclick="document.getElementById('${prefix}-bimg').click()" id="${prefix}-bslot" style="min-height:80px;">`;
      if (mask.beforeImg) html += '<img src="' + mask.beforeImg + '" style="max-height:70px;">'; 
      else html += '<i class="fas fa-camera text-slate-500"></i><p class="text-[9px] text-slate-400">Before</p>';
      html += `<input type="file" id="${prefix}-bimg" accept="image/*" style="display:none" onchange="handleBeamImage(this,'${laserKey}',${mi},'before')">`;
      html += '</div>';
      html += `<div class="image-upload-slot" onclick="document.getElementById('${prefix}-aimg').click()" id="${prefix}-aslot" style="min-height:80px;">`;
      if (mask.afterImg) html += '<img src="' + mask.afterImg + '" style="max-height:70px;">'; 
      else html += '<i class="fas fa-camera text-slate-500"></i><p class="text-[9px] text-slate-400">After</p>';
      html += `<input type="file" id="${prefix}-aimg" accept="image/*" style="display:none" onchange="handleBeamImage(this,'${laserKey}',${mi},'after')">`;
      html += '</div>';
      html += '</div>';
      html += '<div class="grid grid-cols-4 gap-2">';
      html += '<input type="text" class="param-edit-input" value="' + mask.beamSizeBefore + '" id="' + prefix + '-bsb" placeholder="Size Before">';
      html += '<input type="text" class="param-edit-input" value="' + mask.beamSizeAfter + '" id="' + prefix + '-bsa" placeholder="Size After">';
      html += '<input type="text" class="param-edit-input" value="' + mask.beamDiaBefore + '" id="' + prefix + '-bdb" placeholder="Dia Before">';
      html += '<input type="text" class="param-edit-input" value="' + mask.beamDiaAfter + '" id="' + prefix + '-bda" placeholder="Dia After">';
      html += '</div>';
      html += '<div class="grid grid-cols-2 gap-2 mt-1">';
      html += '<input type="text" class="param-edit-input" value="' + mask.specSize + '" id="' + prefix + '-ss" placeholder="Size Spec">';
      html += '<input type="text" class="param-edit-input" value="' + mask.specDia + '" id="' + prefix + '-ds" placeholder="Dia Spec">';
      html += '</div>';
      html += '</div>';
    });
    html += '</div></div>';
  });
  container.innerHTML = html;
}
async function handleBeamImage(input, laserKey, idx, type) {
  const file = input.files[0];
  if (!file) return;
  try {
    const slotId = 'beam-' + laserKey + '-' + idx + '-' + type;
    const objectUrl = await uploadAndStoreImage(file, slotId);
    appState.beamProfiles[laserKey].items[idx][type + 'Img'] = objectUrl;
    const domSlotId = 'bp-' + laserKey + '-' + idx + '-' + (type === 'before' ? 'b' : 'a') + 'slot';
    const slot = document.getElementById(domSlotId);
    if (slot) {
      slot.innerHTML = '<img src="' + objectUrl + '" style="max-height:70px; border-radius:6px;">';
      slot.classList.add('has-image');
    }
  } catch (e) {
    console.error('Beam image upload failed', e);
  }
}
function saveBeamProfileData() {
  ['laser1', 'laser2'].forEach((laserKey, li) => {
    const laser = appState.beamProfiles[laserKey];
    laser.title = document.getElementById('bp-title-' + laserKey).value;
    laser.items.forEach((mask, mi) => {
      const prefix = 'bp-' + laserKey + '-' + mi;
      mask.title = document.getElementById(prefix + '-title').value;
      mask.beamSizeBefore = document.getElementById(prefix + '-bsb').value;
      mask.beamSizeAfter = document.getElementById(prefix + '-bsa').value;
      mask.beamDiaBefore = document.getElementById(prefix + '-bdb').value;
      mask.beamDiaAfter = document.getElementById(prefix + '-bda').value;
      mask.specSize = document.getElementById(prefix + '-ss').value;
      mask.specDia = document.getElementById(prefix + '-ds').value;
    });
  });
  renderBeamProfileReport();
  addChangeLogEntry({ action: 'update', machine: 'Beam Profiles', field: 'Beam Profile Monitor', before: 'Edited', after: 'Saved' });
  closeBeamProfileModal();
}
function addBeamItem(laserKey) {
  const laser = appState.beamProfiles[laserKey];
  const newIdx = laser.items.length > 0 ? Math.max(...laser.items.map(m => m.idx)) + 1 : 1;
  laser.items.push({
    idx: newIdx, aperture: 'New', beforeImg: '', afterImg: '',
    beforeDate: formatDate(new Date()), afterDate: formatDate(new Date()),
    beamSizeBefore: '-', beamSizeAfter: '-', beamDiaBefore: '-', beamDiaAfter: '-',
    specSize: '-', specDia: '-', title: laser.title + ' — Mask New'
  });
  renderBeamProfileEdit();
}
function removeBeamItem(laserKey, idx) {
  const laser = appState.beamProfiles[laserKey];
  if (laser.items.length <= 1) {
    alert('Cannot delete the last item. Each laser must have at least one mask.');
    return;
  }
  if (confirm('Delete this mask item?')) {
    laser.items.splice(idx, 1);
    renderBeamProfileEdit();
  }
}


// ===================== FOCUS OPTIMIZATION RENDERERS =====================
function renderFocusOptimization() {
  const container = document.getElementById('focusOptimizationGrid');
  if (!container) return;
  const fo = appState.focusOptimization;
  let html = '';
  // Summary block
  html += '<div class="mb-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">';
  html += '<p class="text-xs text-slate-400 leading-relaxed">' + fo.summary.description + '</p>';
  html += '<div class="flex gap-4 mt-3 text-xs text-slate-500 font-mono">';
  html += '<span><i class="fas fa-calendar-alt text-neon-blue mr-1"></i> ' + fo.summary.date + '</span>';
  html += '<span><i class="fas fa-user text-neon-purple mr-1"></i> ' + fo.summary.operator + '</span>';
  html += '</div></div>';
  // Measurement cards grid
  html += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">';
  fo.measurements.forEach(m => {
    const statusColor = m.status === 'Pass' ? 'text-neon-green' : 'text-neon-red';
    const statusBg = m.status === 'Pass' ? 'bg-neon-green/10' : 'bg-neon-red/10';
    const statusBorder = m.status === 'Pass' ? 'border-neon-green/20' : 'border-neon-red/20';
    html += '<div class="glass rounded-xl p-4 border border-slate-700/50 hover:border-neon-blue/30 transition-all flex flex-col">';
    // Image slot (centered)
    html += '<div class="mb-3 rounded-lg bg-slate-800/50 border border-slate-700/30 flex items-center justify-center overflow-hidden" style="min-height: 140px;">';
    if (m.image) {
      html += '<img src="' + m.image + '" class="w-full h-full object-contain" style="max-height: 140px;" alt="' + m.title + '">';
    } else {
      html += '<div class="text-center p-4"><i class="fas fa-image text-slate-600 text-2xl mb-2"></i><p class="text-[10px] text-slate-500">[Image placeholder]</p><p class="text-[9px] text-slate-600 mt-1">Replace with actual image</p></div>';
    }
    html += '</div>';
    html += '<div class="flex-1">';
    html += '<p class="text-xs text-slate-400 font-medium mb-1">' + m.title + '</p>';
    html += '<p class="text-xl font-bold text-white font-mono">' + m.value + '</p>';
    html += '<p class="text-[10px] text-slate-500 mt-1">Tolerance: ' + m.tolerance + '</p>';
    html += '<p class="text-[10px] text-slate-500 mt-1 leading-relaxed">' + m.note + '</p>';
    html += '</div>';
    html += '<span class="inline-block mt-3 px-2 py-0.5 rounded text-xs ' + statusBg + ' ' + statusColor + ' border ' + statusBorder + '">' + m.status.toUpperCase() + '</span>';
    html += '</div>';
  });
  html += '</div>';
  container.innerHTML = html;
}

function renderLaserDefocus() {
  const container = document.getElementById('laserDefocusGrid');
  if (!container) return;
  const ld = appState.focusOptimization.laserDefocus;
  let html = '<p class="text-xs text-slate-400 mb-4 leading-relaxed">' + ld.description + '</p>';
  html += '<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">';
  ld.items.forEach(item => {
    const qualityColor = item.quality === 'Excellent' ? 'text-neon-green' : item.quality === 'Good' ? 'text-neon-blue' : item.quality === 'Marginal' ? 'text-neon-amber' : 'text-neon-red';
    const qualityBg = item.quality === 'Excellent' ? 'bg-neon-green/10' : item.quality === 'Good' ? 'bg-neon-blue/10' : item.quality === 'Marginal' ? 'bg-neon-amber/10' : 'bg-neon-red/10';
    const qualityBorder = item.quality === 'Excellent' ? 'border-neon-green/20' : item.quality === 'Good' ? 'border-neon-blue/20' : item.quality === 'Marginal' ? 'border-neon-amber/20' : 'border-neon-red/20';
    html += '<div class="glass rounded-xl p-4 border ' + qualityBorder + ' ' + qualityBg + ' flex flex-col">';
    // Centered image
    html += '<div class="mb-3 rounded-lg bg-slate-900/40 border border-slate-700/30 flex items-center justify-center overflow-hidden" style="min-height: 120px;">';
    if (item.image) {
      html += '<img src="' + item.image + '" class="w-full h-full object-contain" style="max-height: 120px;" alt="Defocus ' + item.defocus + '">';
    } else {
      html += '<div class="text-center p-3"><i class="fas fa-microscope text-slate-600 text-xl mb-1"></i><p class="text-[9px] text-slate-500">[Via image]</p></div>';
    }
    html += '</div>';
    html += '<div class="text-center mb-2"><span class="text-lg font-bold font-mono ' + qualityColor + '">' + item.defocus + '</span></div>';
    html += '<div class="space-y-1 text-xs text-slate-400 flex-1">';
    html += '<div class="flex justify-between"><span>Via Size</span><span class="font-mono text-white">' + item.viaSize + '</span></div>';
    html += '<div class="flex justify-between"><span>Roundness</span><span class="font-mono text-white">' + item.roundness + '</span></div>';
    html += '</div>';
    html += '<span class="inline-block mt-3 px-2 py-0.5 rounded text-[10px] ' + qualityBg + ' ' + qualityColor + ' border ' + qualityBorder + ' text-center">' + item.quality + '</span>';
    html += '<p class="text-[9px] text-slate-500 mt-2 leading-relaxed">' + item.desc + '</p>';
    html += '</div>';
  });
  html += '</div>';
  container.innerHTML = html;
}

function openFocusModal() {
  renderFocusEdit();
  openModalA11y('focusModal');
}
function closeFocusModal() { closeModalA11y('focusModal'); }
function renderFocusEdit() {
  const container = document.getElementById('focusEditContent');
  const fo = appState.focusOptimization;
  let html = '<div class="mb-4"><span class="edit-label">Report Description</span><textarea class="edit-textarea" id="fo-desc" rows="2">' + fo.summary.description + '</textarea></div>';
  html += '<h3 class="text-sm font-bold text-white mb-3">Focus Measurements</h3>';
  html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">';
  fo.measurements.forEach((m, idx) => {
    html += '<div class="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">';
    html += '<div class="flex items-center justify-between mb-2">';
    html += '<input type="text" class="param-edit-input" value="' + m.title + '" id="fo-title-' + idx + '" style="font-weight:600; color:white; background:transparent; border:none; padding:0;">';
    html += '<button onclick="removeFocusMeasurement(' + idx + ')" class="btn-sm btn-danger"><i class="fas fa-trash"></i></button>';
    html += '</div>';
    html += '<div class="grid grid-cols-2 gap-2 mb-2">';
    html += '<div><span class="edit-label" style="font-size:9px;">Value</span><input type="text" class="param-edit-input" value="' + m.value + '" id="fo-value-' + idx + '"></div>';
    html += '<div><span class="edit-label" style="font-size:9px;">Tolerance</span><input type="text" class="param-edit-input" value="' + m.tolerance + '" id="fo-tol-' + idx + '"></div>';
    html += '</div>';
    html += '<div class="mb-2"><span class="edit-label" style="font-size:9px;">Note</span><input type="text" class="param-edit-input" value="' + m.note + '" id="fo-note-' + idx + '"></div>';
    html += '<div class="mb-2"><span class="edit-label" style="font-size:9px;">Status</span><select class="param-edit-select" id="fo-status-' + idx + '"><option value="Pass" ' + (m.status==='Pass'?'selected':'') + '>Pass</option><option value="Fail" ' + (m.status==='Fail'?'selected':'') + '>Fail</option></select></div>';
    html += '<div class="image-upload-slot" onclick="document.getElementById(\'fo-img-\' + idx + \').click()" id="fo-slot-' + idx + '" style="min-height:80px;">';
    if (m.image) html += '<img src="' + m.image + '" style="max-height:70px; border-radius:6px;">';
    else html += '<i class="fas fa-camera text-slate-500"></i><p class="text-[9px] text-slate-400">Click to upload image</p>';
    html += '<input type="file" id="fo-img-' + idx + '" accept="image/*" style="display:none" onchange="handleFocusImage(this,' + idx + ')">';
    html += '</div>';
    html += '</div>';
  });
  html += '</div>';
  html += '<button onclick="addFocusMeasurement()" class="btn-sm btn-add mb-4"><i class="fas fa-plus mr-1"></i> Add measurement</button>';
  // Defocus items
  html += '<h3 class="text-sm font-bold text-white mb-3">Laser Defocus Items</h3>';
  html += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">';
  fo.laserDefocus.items.forEach((item, idx) => {
    html += '<div class="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">';
    html += '<div class="flex items-center justify-between mb-2">';
    html += '<input type="text" class="param-edit-input" value="' + item.defocus + '" id="fd-defocus-' + idx + '" style="font-weight:600; color:white; background:transparent; border:none; padding:0;">';
    html += '<button onclick="removeDefocusItem(' + idx + ')" class="btn-sm btn-danger"><i class="fas fa-trash"></i></button>';
    html += '</div>';
    html += '<div class="grid grid-cols-2 gap-2 mb-2">';
    html += '<div><span class="edit-label" style="font-size:9px;">Via Size</span><input type="text" class="param-edit-input" value="' + item.viaSize + '" id="fd-size-' + idx + '"></div>';
    html += '<div><span class="edit-label" style="font-size:9px;">Roundness</span><input type="text" class="param-edit-input" value="' + item.roundness + '" id="fd-round-' + idx + '"></div>';
    html += '</div>';
    html += '<div class="mb-2"><span class="edit-label" style="font-size:9px;">Quality</span><select class="param-edit-select" id="fd-quality-' + idx + '"><option value="Excellent" ' + (item.quality==='Excellent'?'selected':'') + '>Excellent</option><option value="Good" ' + (item.quality==='Good'?'selected':'') + '>Good</option><option value="Marginal" ' + (item.quality==='Marginal'?'selected':'') + '>Marginal</option><option value="Poor" ' + (item.quality==='Poor'?'selected':'') + '>Poor</option></select></div>';
    html += '<div class="mb-2"><span class="edit-label" style="font-size:9px;">Description</span><input type="text" class="param-edit-input" value="' + item.desc + '" id="fd-desc-' + idx + '"></div>';
    html += '<div class="image-upload-slot" onclick="document.getElementById(\'fd-img-\' + idx + \').click()" id="fd-slot-' + idx + '" style="min-height:80px;">';
    if (item.image) html += '<img src="' + item.image + '" style="max-height:70px; border-radius:6px;">';
    else html += '<i class="fas fa-camera text-slate-500"></i><p class="text-[9px] text-slate-400">Click to upload via image</p>';
    html += '<input type="file" id="fd-img-' + idx + '" accept="image/*" style="display:none" onchange="handleDefocusImage(this,' + idx + ')">';
    html += '</div>';
    html += '</div>';
  });
  html += '</div>';
  html += '<button onclick="addDefocusItem()" class="btn-sm btn-add mt-3"><i class="fas fa-plus mr-1"></i> Add defocus item</button>';
  container.innerHTML = html;
}
async function handleFocusImage(input, idx) {
  const file = input.files[0]; if (!file) return;
  try {
    const objectUrl = await uploadAndStoreImage(file, 'focus-meas-' + idx);
    appState.focusOptimization.measurements[idx].image = objectUrl;
    const slot = document.getElementById('fo-slot-' + idx);
    slot.innerHTML = '<img src="' + objectUrl + '" style="max-height:70px; border-radius:6px;">'; slot.classList.add('has-image');
  } catch (e) { console.error('Focus image upload failed', e); }
}
async function handleDefocusImage(input, idx) {
  const file = input.files[0]; if (!file) return;
  try {
    const objectUrl = await uploadAndStoreImage(file, 'focus-defocus-' + idx);
    appState.focusOptimization.laserDefocus.items[idx].image = objectUrl;
    const slot = document.getElementById('fd-slot-' + idx);
    slot.innerHTML = '<img src="' + objectUrl + '" style="max-height:70px; border-radius:6px;">'; slot.classList.add('has-image');
  } catch (e) { console.error('Defocus image upload failed', e); }
}
function addFocusMeasurement() {
  const newId = appState.focusOptimization.measurements.length > 0 ? Math.max(...appState.focusOptimization.measurements.map(m => m.id)) + 1 : 1;
  appState.focusOptimization.measurements.push({ id: newId, title: 'New Measurement', value: '-', tolerance: '-', status: 'Pass', image: '', note: '' });
  renderFocusEdit();
}
function removeFocusMeasurement(idx) {
  appState.focusOptimization.measurements.splice(idx, 1);
  renderFocusEdit();
}
function addDefocusItem() {
  const items = appState.focusOptimization.laserDefocus.items;
  const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
  items.push({ id: newId, defocus: '0 μm', viaSize: '-', roundness: '-', quality: 'Good', image: '', desc: '' });
  renderFocusEdit();
}
function removeDefocusItem(idx) {
  appState.focusOptimization.laserDefocus.items.splice(idx, 1);
  renderFocusEdit();
}
function saveFocusData() {
  const fo = appState.focusOptimization;
  fo.summary.description = document.getElementById('fo-desc').value;
  fo.measurements.forEach((m, idx) => {
    m.title = document.getElementById('fo-title-' + idx).value;
    m.value = document.getElementById('fo-value-' + idx).value;
    m.tolerance = document.getElementById('fo-tol-' + idx).value;
    m.note = document.getElementById('fo-note-' + idx).value;
    m.status = document.getElementById('fo-status-' + idx).value;
  });
  fo.laserDefocus.items.forEach((item, idx) => {
    item.defocus = document.getElementById('fd-defocus-' + idx).value;
    item.viaSize = document.getElementById('fd-size-' + idx).value;
    item.roundness = document.getElementById('fd-round-' + idx).value;
    item.quality = document.getElementById('fd-quality-' + idx).value;
    item.desc = document.getElementById('fd-desc-' + idx).value;
  });
  renderFocusOptimization();
  renderLaserDefocus();
  addChangeLogEntry({ action: 'update', machine: 'Focus System', field: 'Focus Optimization', before: 'Edited', after: 'Saved' });
  closeFocusModal();
}

// ===================== POWER OFFSET RENDERERS =====================
function renderPowerOffset() {
  const container = document.getElementById('powerOffsetGrid');
  if (!container) return;
  const po = appState.powerOffset;
  let html = '';
  // Summary
  html += '<div class="mb-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">';
  html += '<p class="text-xs text-slate-400 leading-relaxed">' + po.summary.description + '</p>';
  html += '<div class="flex gap-4 mt-3 text-xs text-slate-500 font-mono">';
  html += '<span><i class="fas fa-calendar-alt text-neon-purple mr-1"></i> ' + po.summary.date + '</span>';
  html += '</div></div>';
  // Items grid
  html += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
  po.items.forEach(item => {
    const offsetVal = parseFloat(item.offset);
    const targetVal = parseFloat(item.target);
    const isOk = Math.abs(offsetVal) <= Math.abs(targetVal);
    const statusColor = isOk ? 'text-neon-green' : 'text-neon-red';
    const statusBg = isOk ? 'bg-neon-green/10' : 'bg-neon-red/10';
    const statusBorder = isOk ? 'border-neon-green/20' : 'border-neon-red/20';
    const compColor = item.compensated === 'Yes' ? 'text-neon-blue' : 'text-slate-400';
    html += '<div class="glass rounded-xl p-4 border border-slate-700/50 hover:border-neon-purple/30 transition-all flex flex-col">';
    // Centered image
    html += '<div class="mb-3 rounded-lg bg-slate-800/50 border border-slate-700/30 flex items-center justify-center overflow-hidden" style="min-height: 140px;">';
    if (item.image) {
      html += '<img src="' + item.image + '" class="w-full h-full object-contain" style="max-height: 140px;" alt="' + item.channel + '">';
    } else {
      html += '<div class="text-center p-4"><i class="fas fa-chart-area text-slate-600 text-2xl mb-2"></i><p class="text-[10px] text-slate-500">[Power map image]</p><p class="text-[9px] text-slate-600 mt-1">Replace with actual image</p></div>';
    }
    html += '</div>';
    html += '<div class="flex-1">';
    html += '<p class="text-xs text-slate-400 font-medium mb-2">' + item.channel + '</p>';
    html += '<div class="grid grid-cols-2 gap-2 mb-3">';
    html += '<div class="p-2 rounded-lg bg-slate-800/30 border border-slate-700/30 text-center">';
    html += '<p class="text-[9px] text-slate-500 uppercase">Offset</p>';
    html += '<p class="text-sm font-bold font-mono ' + statusColor + '">' + item.offset + '</p></div>';
    html += '<div class="p-2 rounded-lg bg-slate-800/30 border border-slate-700/30 text-center">';
    html += '<p class="text-[9px] text-slate-500 uppercase">Target</p>';
    html += '<p class="text-sm font-bold font-mono text-white">' + item.target + '</p></div>';
    html += '</div>';
    html += '<div class="flex items-center justify-between text-xs mb-2">';
    html += '<span class="text-slate-500">Before: <span class="font-mono text-slate-300">' + item.before + '</span></span>';
    html += '<span class="text-slate-500">After: <span class="font-mono text-white">' + item.after + '</span></span>';
    html += '</div>';
    html += '<p class="text-[10px] text-slate-500 leading-relaxed">' + item.desc + '</p>';
    html += '</div>';
    html += '<div class="flex items-center justify-between mt-3">';
    html += '<span class="inline-block px-2 py-0.5 rounded text-xs ' + statusBg + ' ' + statusColor + ' border ' + statusBorder + '">' + (isOk ? 'WITHIN SPEC' : 'OUT OF SPEC') + '</span>';
    html += '<span class="text-[10px] ' + compColor + '"><i class="fas fa-check-circle mr-1"></i>Compensated: ' + item.compensated + '</span>';
    html += '</div>';
    html += '</div>';
  });
  html += '</div>';
  container.innerHTML = html;
}

function openPowerOffsetModal() {
  renderPowerOffsetEdit();
  openModalA11y('powerOffsetModal');
}
function closePowerOffsetModal() { closeModalA11y('powerOffsetModal'); }
function renderPowerOffsetEdit() {
  const container = document.getElementById('powerOffsetEditContent');
  const po = appState.powerOffset;
  let html = '<div class="mb-4"><span class="edit-label">Report Description</span><textarea class="edit-textarea" id="po-desc" rows="2">' + po.summary.description + '</textarea></div>';
  html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-3">';
  po.items.forEach((item, idx) => {
    html += '<div class="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">';
    html += '<div class="flex items-center justify-between mb-2">';
    html += '<input type="text" class="param-edit-input" value="' + item.channel + '" id="po-ch-' + idx + '" style="font-weight:600; color:white; background:transparent; border:none; padding:0;">';
    html += '<button onclick="removePowerOffsetItem(' + idx + ')" class="btn-sm btn-danger"><i class="fas fa-trash"></i></button>';
    html += '</div>';
    html += '<div class="grid grid-cols-2 gap-2 mb-2">';
    html += '<div><span class="edit-label" style="font-size:9px;">Offset</span><input type="text" class="param-edit-input" value="' + item.offset + '" id="po-off-' + idx + '"></div>';
    html += '<div><span class="edit-label" style="font-size:9px;">Target</span><input type="text" class="param-edit-input" value="' + item.target + '" id="po-target-' + idx + '"></div>';
    html += '<div><span class="edit-label" style="font-size:9px;">Before</span><input type="text" class="param-edit-input" value="' + item.before + '" id="po-before-' + idx + '"></div>';
    html += '<div><span class="edit-label" style="font-size:9px;">After</span><input type="text" class="param-edit-input" value="' + item.after + '" id="po-after-' + idx + '"></div>';
    html += '</div>';
    html += '<div class="mb-2"><span class="edit-label" style="font-size:9px;">Compensated</span><select class="param-edit-select" id="po-comp-' + idx + '"><option value="Yes" ' + (item.compensated==='Yes'?'selected':'') + '>Yes</option><option value="No" ' + (item.compensated==='No'?'selected':'') + '>No</option></select></div>';
    html += '<div class="mb-2"><span class="edit-label" style="font-size:9px;">Description</span><input type="text" class="param-edit-input" value="' + item.desc + '" id="po-desc-' + idx + '"></div>';
    html += '<div class="image-upload-slot" onclick="document.getElementById(\'po-img-\' + idx + \').click()" id="po-slot-' + idx + '" style="min-height:80px;">';
    if (item.image) html += '<img src="' + item.image + '" style="max-height:70px; border-radius:6px;">';
    else html += '<i class="fas fa-camera text-slate-500"></i><p class="text-[9px] text-slate-400">Click to upload image</p>';
    html += '<input type="file" id="po-img-' + idx + '" accept="image/*" style="display:none" onchange="handlePowerOffsetImage(this,' + idx + ')">';
    html += '</div>';
    html += '</div>';
  });
  html += '</div>';
  html += '<button onclick="addPowerOffsetItem()" class="btn-sm btn-add mt-3"><i class="fas fa-plus mr-1"></i> Add offset item</button>';
  container.innerHTML = html;
}
async function handlePowerOffsetImage(input, idx) {
  const file = input.files[0]; if (!file) return;
  try {
    const objectUrl = await uploadAndStoreImage(file, 'power-offset-' + idx);
    appState.powerOffset.items[idx].image = objectUrl;
    const slot = document.getElementById('po-slot-' + idx);
    slot.innerHTML = '<img src="' + objectUrl + '" style="max-height:70px; border-radius:6px;">'; slot.classList.add('has-image');
  } catch (e) { console.error('Power offset image upload failed', e); }
}
function addPowerOffsetItem() {
  const items = appState.powerOffset.items;
  const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
  items.push({ id: newId, channel: 'New Channel', offset: '0%', target: '±3%', compensated: 'No', before: '0%', after: '0%', image: '', desc: '' });
  renderPowerOffsetEdit();
}
function removePowerOffsetItem(idx) {
  appState.powerOffset.items.splice(idx, 1);
  renderPowerOffsetEdit();
}
function savePowerOffsetData() {
  const po = appState.powerOffset;
  po.summary.description = document.getElementById('po-desc').value;
  po.items.forEach((item, idx) => {
    item.channel = document.getElementById('po-ch-' + idx).value;
    item.offset = document.getElementById('po-off-' + idx).value;
    item.target = document.getElementById('po-target-' + idx).value;
    item.before = document.getElementById('po-before-' + idx).value;
    item.after = document.getElementById('po-after-' + idx).value;
    item.compensated = document.getElementById('po-comp-' + idx).value;
    item.desc = document.getElementById('po-desc-' + idx).value;
  });
  renderPowerOffset();
  addChangeLogEntry({ action: 'update', machine: 'Power Offset', field: 'Power Offset', before: 'Edited', after: 'Saved' });
  closePowerOffsetModal();
}

// ===================== ENHANCED REPORT STATE =====================
let reportState = {
  parameters: [
    { id: 1, param: 'Laser Power', before: '85%', after: '92%', target: '>90%', tolerance: '±5%', unit: '%', status: 'Pass', trend: 'up', rootCause: 'Lens contamination reduced output. Cleaning restored power.', action: 'Cleaned lens. Ordered spare lens for next quarter.' },
    { id: 2, param: 'Laser Accuracy', before: '±3μm', after: '±1.5μm', target: '±2μm', tolerance: '±0.5μm', unit: 'μm', status: 'Pass', trend: 'up', rootCause: 'Scanner mirror misalignment caused drift. Re-aligned.', action: 'Re-aligned optics path. Accuracy restored to spec.' },
    { id: 3, param: 'Via Size', before: '45μm', after: '42μm', target: '40-45μm', tolerance: '±2.5μm', unit: 'μm', status: 'Pass', trend: 'stable', rootCause: 'Within tolerance. No action required.', action: 'Monitor in next visit.' },
    { id: 4, param: 'Via Offset', before: '±2μm', after: '±0.5μm', target: '±1μm', tolerance: '±0.5μm', unit: 'μm', status: 'Pass', trend: 'up', rootCause: 'Stage calibration drift. Recalibrated AGC scanner.', action: 'Recalibrated stage. Verified with test pattern.' },
    { id: 5, param: 'Laser Profile', before: 'Gaussian', after: 'Gaussian', target: 'Gaussian', tolerance: 'N/A', unit: '', status: 'Pass', trend: 'stable', rootCause: 'Profile stable. No degradation detected.', action: 'Continue monitoring.' },
    { id: 6, param: 'Via Shape', before: 'Oval', after: 'Circular', target: 'Circular', tolerance: 'N/A', unit: '', status: 'Pass', trend: 'up', rootCause: 'Beam shape correction via optics alignment.', action: 'Optics alignment corrected shape to circular.' },
    { id: 7, param: 'Pad Quality', before: 'Good', after: 'Excellent', target: 'Good+', tolerance: 'N/A', unit: '', status: 'Pass', trend: 'up', rootCause: 'Improved after cleaning and calibration.', action: 'No further action required.' },
  ],
  images: {}
};

const UV_LASER_MAX_HOURS = 25000;
const UV_LASER_WARNING = 20000;

// ===================== IMAGE HANDLING =====================
async function handleImageUpload(input, slotId) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { alert('Image too large (max 5MB). Please compress.'); input.value = ''; return; }
  try {
    const objectUrl = await uploadAndStoreImage(file, slotId);
    const slot = document.getElementById(slotId);
    slot.innerHTML = '<img src="' + objectUrl + '" alt="Uploaded"><p class="text-xs text-slate-400 mt-1">' + file.name + '</p>';
    slot.classList.add('has-image');
    reportState.images[slotId] = objectUrl;
  } catch (e) {
    console.error('Image upload failed', e);
    alert('Failed to store image. IndexedDB may be full.');
  }
}

// ===================== UV LASER HOURS =====================
function updateUVLaserDisplay() {
  const machines = ['M1', 'M2', 'M3', 'M4', 'M5'];
  let anyWarning = false;
  let anyAlarm = false;
  let alertText = '';

  machines.forEach(m => {
    const hours = parseInt(document.getElementById('uvHours' + m).value) || 0;
    const remaining = UV_LASER_MAX_HOURS - hours;
    const pct = (hours / UV_LASER_MAX_HOURS) * 100;
    const bar = document.getElementById('uvBar' + m);
    const status = document.getElementById('uvStatus' + m);

    bar.style.width = pct + '%';

    if (hours >= UV_LASER_MAX_HOURS) {
      bar.className = 'h-full bg-neon-red transition-all';
      status.className = 'text-xs text-neon-red mt-1';
      status.textContent = '🔴 ALARM — Replace immediately!';
      anyAlarm = true;
      alertText += 'Machine ' + m.replace('M', '') + ': ' + hours + 'h (EXCEEDED 25,000h limit). ';
    } else if (hours >= UV_LASER_WARNING) {
      bar.className = 'h-full bg-neon-amber transition-all';
      status.className = 'text-xs text-neon-amber mt-1';
      status.textContent = '⚠ WARNING — ' + remaining + 'h remaining';
      anyWarning = true;
      alertText += 'Machine ' + m.replace('M', '') + ': ' + hours + 'h (WARNING: ' + remaining + 'h left). ';
    } else {
      bar.className = 'h-full bg-neon-green transition-all';
      status.className = 'text-xs text-neon-green mt-1';
      status.textContent = remaining + 'h remaining';
    }
  });

  const banner = document.getElementById('uvLaserAlertBanner');
  if (anyAlarm || anyWarning) {
    banner.style.display = 'block';
    document.getElementById('uvAlertText').textContent = alertText;
    if (anyAlarm) banner.className = 'mt-3 p-3 rounded-lg severity-critical';
    else banner.className = 'mt-3 p-3 rounded-lg severity-warning';
  } else {
    banner.style.display = 'none';
  }
}

// ===================== CDA MONITORING =====================
function updateCDAGraph() {
  const before = [
    parseFloat(document.getElementById('cdaBeforeD1').value) || 0,
    parseFloat(document.getElementById('cdaBeforeD2').value) || 0,
    parseFloat(document.getElementById('cdaBeforeD3').value) || 0
  ];
  const after = [
    parseFloat(document.getElementById('cdaAfterD1').value) || 0,
    parseFloat(document.getElementById('cdaAfterD2').value) || 0,
    parseFloat(document.getElementById('cdaAfterD3').value) || 0
  ];

  document.getElementById('cdaBeforeAvg').value = (before.reduce((a,b) => a+b, 0) / 3).toFixed(1);
  document.getElementById('cdaAfterAvg').value = (after.reduce((a,b) => a+b, 0) / 3).toFixed(1);

  const ctx = document.getElementById('cdaChartPreview');
  if (cdaChart) cdaChart.destroy();
  cdaChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Day 1', 'Day 2', 'Day 3'],
      datasets: [
        { label: 'Before Service (kPa)', data: before, backgroundColor: 'rgba(148, 163, 184, 0.5)', borderColor: '#94a3b8', borderWidth: 1 },
        { label: 'After Service (kPa)', data: after, backgroundColor: 'rgba(0, 212, 255, 0.5)', borderColor: '#00d4ff', borderWidth: 1 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      resizeDelay: 500,
      scales: {
        y: { beginAtZero: true, max: 800, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
        x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
      },
      plugins: { legend: { labels: { color: '#e2e8f0' } } }
    }
  });
}

// ===================== COOLING SYSTEM =====================
function updateCoolingDisplay() {
  const channels = [];
  for (let c = 1; c <= 6; c++) {
    const setVal = parseFloat(document.getElementById('coolSet' + c).value) || 0;
    const alarmVal = parseFloat(document.getElementById('coolAlarm' + c).value) || 0;
    const d1 = parseFloat(document.getElementById('coolD1C' + c).value) || 0;
    const d2 = parseFloat(document.getElementById('coolD2C' + c).value) || 0;
    const d3 = parseFloat(document.getElementById('coolD3C' + c).value) || 0;
    const maxTemp = Math.max(d1, d2, d3);

    const statusEl = document.getElementById('coolStatus' + c);
    if (maxTemp >= alarmVal) {
      statusEl.className = 'px-2 py-0.5 rounded text-xs bg-neon-red/10 text-neon-red';
      statusEl.textContent = '🔴 ALARM';
    } else if (maxTemp >= setVal + (alarmVal - setVal) * 0.7) {
      statusEl.className = 'px-2 py-0.5 rounded text-xs bg-neon-amber/10 text-neon-amber';
      statusEl.textContent = '⚠ WARM';
    } else {
      statusEl.className = 'px-2 py-0.5 rounded text-xs bg-neon-green/10 text-neon-green';
      statusEl.textContent = 'OK';
    }

    channels.push({ d1, d2, d3, setVal, alarmVal });
  }

  // Update cooling chart
  const ctx = document.getElementById('coolingChartPreview');
  if (coolingChart) coolingChart.destroy();

  const colors = ['#00d4ff', '#a855f7', '#f59e0b', '#22c55e', '#ef4444', '#64748b'];
  const datasets = [];
  for (let c = 1; c <= 6; c++) {
    datasets.push({
      label: 'Ch' + c,
      data: [channels[c-1].d1, channels[c-1].d2, channels[c-1].d3],
      borderColor: colors[c-1],
      backgroundColor: colors[c-1] + '33',
      tension: 0.3,
      pointRadius: 4,
      fill: false
    });
    // Add alarm line
    datasets.push({
      label: 'Ch' + c + ' Alarm',
      data: [channels[c-1].alarmVal, channels[c-1].alarmVal, channels[c-1].alarmVal],
      borderColor: colors[c-1],
      borderDash: [5, 5],
      pointRadius: 0,
      fill: false
    });
  }

  coolingChart = new Chart(ctx, {
    type: 'line',
    data: { labels: ['Day 1', 'Day 2', 'Day 3'], datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      resizeDelay: 500,
      scales: {
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
        x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
      },
      plugins: { legend: { labels: { color: '#e2e8f0', font: { size: 10 } }, position: 'bottom' } }
    }
  });
}

// ===================== HEALTH SCORE =====================
function updateHealthScoreDisplay() {
  const score = document.getElementById('healthScore').value;
  document.getElementById('healthScoreDisplay').textContent = score;
  const display = document.getElementById('healthScoreDisplay');
  if (score >= 90) display.className = 'text-2xl font-bold font-mono text-neon-green';
  else if (score >= 70) display.className = 'text-2xl font-bold font-mono text-neon-amber';
  else display.className = 'text-2xl font-bold font-mono text-neon-red';
}

// ===================== PARAMETER EDITING =====================
function renderParameterEditList() {
  const container = document.getElementById('parameterEditList');
  let html = '<div style="overflow-x: auto;"><table style="width:100%; font-size: 12px;">';
  html += '<thead><tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">';
  html += '<th style="text-align:left; padding: 8px; color: #94a3b8;">Parameter</th>';
  html += '<th style="text-align:left; padding: 8px; color: #94a3b8;">Before</th>';
  html += '<th style="text-align:left; padding: 8px; color: #94a3b8;">After</th>';
  html += '<th style="text-align:left; padding: 8px; color: #94a3b8;">Target</th>';
  html += '<th style="text-align:left; padding: 8px; color: #94a3b8;">Tolerance</th>';
  html += '<th style="text-align:left; padding: 8px; color: #94a3b8;">Status</th>';
  html += '<th style="text-align:left; padding: 8px; color: #94a3b8;">Trend</th>';
  html += '<th style="text-align:left; padding: 8px; color: #94a3b8;">Root Cause</th>';
  html += '<th style="text-align:left; padding: 8px; color: #94a3b8;">Action</th>';
  html += '<th></th></tr></thead><tbody>';

  reportState.parameters.forEach((p, idx) => {
    html += '<tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">';
    html += '<td style="padding: 8px;"><input type="text" class="param-edit-input" value="' + p.param + '" id="rp-param-' + idx + '" style="width: 120px;"></td>';
    html += '<td style="padding: 8px;"><input type="text" class="param-edit-input" value="' + p.before + '" id="rp-before-' + idx + '" style="width: 80px;"></td>';
    html += '<td style="padding: 8px;"><input type="text" class="param-edit-input" value="' + p.after + '" id="rp-after-' + idx + '" style="width: 80px;"></td>';
    html += '<td style="padding: 8px;"><input type="text" class="param-edit-input" value="' + p.target + '" id="rp-target-' + idx + '" style="width: 80px;"></td>';
    html += '<td style="padding: 8px;"><input type="text" class="param-edit-input" value="' + p.tolerance + '" id="rp-tolerance-' + idx + '" style="width: 70px;"></td>';
    html += '<td style="padding: 8px;"><select class="param-edit-select" id="rp-status-' + idx + '"><option value="Pass" ' + (p.status === 'Pass' ? 'selected' : '') + '>Pass</option><option value="Fail" ' + (p.status === 'Fail' ? 'selected' : '') + '>Fail</option><option value="Warning" ' + (p.status === 'Warning' ? 'selected' : '') + '>Warning</option></select></td>';
    html += '<td style="padding: 8px;"><select class="param-edit-select" id="rp-trend-' + idx + '"><option value="up" ' + (p.trend === 'up' ? 'selected' : '') + '>↗ Up</option><option value="down" ' + (p.trend === 'down' ? 'selected' : '') + '>↘ Down</option><option value="stable" ' + (p.trend === 'stable' ? 'selected' : '') + '>→ Stable</option></select></td>';
    html += '<td style="padding: 8px;"><input type="text" class="param-edit-input" value="' + (p.rootCause || '') + '" id="rp-rootcause-' + idx + '" placeholder="Root cause..." style="width: 150px;"></td>';
    html += '<td style="padding: 8px;"><input type="text" class="param-edit-input" value="' + (p.action || '') + '" id="rp-action-' + idx + '" placeholder="Action taken..." style="width: 150px;"></td>';
    html += '<td style="padding: 8px;"><button onclick="removeParameter(' + idx + ')" class="btn-sm btn-danger"><i class="fas fa-trash"></i></button></td>';
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  container.innerHTML = html;
}

function addParameter() {
  const newId = reportState.parameters.length > 0 ? Math.max(...reportState.parameters.map(p => p.id)) + 1 : 1;
  reportState.parameters.push({ id: newId, param: 'New Parameter', before: '-', after: '-', target: '-', tolerance: '-', unit: '', status: 'Pass', trend: 'stable', rootCause: '', action: '' });
  renderParameterEditList();
  updateCharts();
}

function removeParameter(idx) {
  reportState.parameters.splice(idx, 1);
  renderParameterEditList();
  updateCharts();
}

function saveParameters() {
  const newParams = [];
  reportState.parameters.forEach((p, idx) => {
    newParams.push({
      ...p,
      param: document.getElementById('rp-param-' + idx)?.value || p.param,
      before: document.getElementById('rp-before-' + idx)?.value || p.before,
      after: document.getElementById('rp-after-' + idx)?.value || p.after,
      target: document.getElementById('rp-target-' + idx)?.value || p.target,
      tolerance: document.getElementById('rp-tolerance-' + idx)?.value || p.tolerance,
      status: document.getElementById('rp-status-' + idx)?.value || p.status,
      trend: document.getElementById('rp-trend-' + idx)?.value || p.trend,
      rootCause: document.getElementById('rp-rootcause-' + idx)?.value || p.rootCause,
      action: document.getElementById('rp-action-' + idx)?.value || p.action
    });
  });
  reportState.parameters = newParams;
}

// ===================== CHARTS =====================
let radarChart, barChart, trendChart;

function updateCharts() {
  saveParameters();
  const radarCtx = document.getElementById('radarChartPreview');
  if (radarChart) radarChart.destroy();
  const paramLabels = reportState.parameters.map(p => p.param);
  const currentScores = reportState.parameters.map(p => p.status === 'Pass' ? 95 : p.status === 'Warning' ? 75 : 40);
  const targetScores = reportState.parameters.map(() => 100);
  radarChart = new Chart(radarCtx, {
    type: 'radar',
    data: { labels: paramLabels, datasets: [{ label: 'Current', data: currentScores, borderColor: '#00d4ff', backgroundColor: 'rgba(0, 212, 255, 0.2)', pointBackgroundColor: '#00d4ff', pointBorderColor: '#fff' }, { label: 'Target', data: targetScores, borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderDash: [5, 5], pointRadius: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, animation: { duration: 0 }, resizeDelay: 500, scales: { r: { beginAtZero: true, max: 100, ticks: { color: '#94a3b8', backdropColor: 'transparent' }, grid: { color: 'rgba(255,255,255,0.1)' }, pointLabels: { color: '#e2e8f0', font: { size: 10 } } } }, plugins: { legend: { labels: { color: '#e2e8f0' } } } }
  });

  const barCtx = document.getElementById('barChartPreview');
  if (barChart) barChart.destroy();
  const beforeVals = reportState.parameters.map(p => parseFloat(p.before) || 0);
  const afterVals = reportState.parameters.map(p => parseFloat(p.after) || 0);
  barChart = new Chart(barCtx, {
    type: 'bar',
    data: { labels: paramLabels, datasets: [{ label: 'Before', data: beforeVals, backgroundColor: 'rgba(148, 163, 184, 0.5)', borderColor: '#94a3b8', borderWidth: 1 }, { label: 'After', data: afterVals, backgroundColor: 'rgba(0, 212, 255, 0.5)', borderColor: '#00d4ff', borderWidth: 1 }] },
    options: { responsive: true, maintainAspectRatio: false, animation: { duration: 0 }, resizeDelay: 500, scales: { y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { ticks: { color: '#94a3b8' }, grid: { display: false } } }, plugins: { legend: { labels: { color: '#e2e8f0' } } } }
  });

  const trendCtx = document.getElementById('trendChartPreview');
  if (trendChart) trendChart.destroy();
  trendChart = new Chart(trendCtx, {
    type: 'line',
    data: { labels: ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Current'], datasets: reportState.parameters.slice(0, 4).map((p, i) => ({ label: p.param, data: [parseFloat(p.before) * 0.9, parseFloat(p.before) * 0.95, parseFloat(p.before) * 0.98, parseFloat(p.after)], borderColor: ['#00d4ff', '#a855f7', '#f59e0b', '#22c55e'][i], backgroundColor: 'transparent', tension: 0.4, pointRadius: 4 })) },
    options: { responsive: true, maintainAspectRatio: false, animation: { duration: 0 }, resizeDelay: 500, scales: { y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { ticks: { color: '#94a3b8' }, grid: { display: false } } }, plugins: { legend: { labels: { color: '#e2e8f0' } } } }
  });
}

// ===================== LOCAL STORAGE =====================
function saveReportToLocalStorage() {
  saveParameters();
  const data = {
    fse: document.getElementById('reportFSE').value,
    date: document.getElementById('reportDate').value,
    machineId: document.getElementById('reportMachineId').value,
    week: document.getElementById('reportWeek').value,
    healthScore: document.getElementById('healthScore').value,
    findings: document.getElementById('reportFindings').value,
    rootCause: document.getElementById('reportRootCause').value,
    actions: document.getElementById('reportActions').value,
    recommendations: document.getElementById('reportRecommendations').value,
    criticalPart: document.getElementById('criticalPart').value,
    criticalUrgency: document.getElementById('criticalUrgency').value,
    criticalFinding: document.getElementById('criticalFinding').value,
    warningFinding: document.getElementById('warningFinding').value,
    uvHours: {
      M1: document.getElementById('uvHoursM1').value,
      M2: document.getElementById('uvHoursM2').value,
      M3: document.getElementById('uvHoursM3').value,
      M4: document.getElementById('uvHoursM4').value,
      M5: document.getElementById('uvHoursM5').value
    },
    cda: {
      beforeD1: document.getElementById('cdaBeforeD1').value,
      beforeD2: document.getElementById('cdaBeforeD2').value,
      beforeD3: document.getElementById('cdaBeforeD3').value,
      afterD1: document.getElementById('cdaAfterD1').value,
      afterD2: document.getElementById('cdaAfterD2').value,
      afterD3: document.getElementById('cdaAfterD3').value,
      notes: document.getElementById('cdaNotes').value
    },
    cooling: {},
    parameters: reportState.parameters,
    images: reportState.images,
    savedAt: new Date().toISOString()
  };

  // Save cooling data
  for (let c = 1; c <= 6; c++) {
    data.cooling['ch' + c] = {
      set: document.getElementById('coolSet' + c).value,
      alarm: document.getElementById('coolAlarm' + c).value,
      d1: document.getElementById('coolD1C' + c).value,
      d2: document.getElementById('coolD2C' + c).value,
      d3: document.getElementById('coolD3C' + c).value
    };
  }
  data.cooling.notes = document.getElementById('coolingNotes').value;

  localStorage.setItem('eoTechnicsReportDraft', JSON.stringify(data));
  addChangeLogEntry({ action: 'create', machine: 'Report Generator', field: 'Buyoff Report Draft', before: '-', after: 'Saved to localStorage' });

  // Show confirmation
  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-check mr-1"></i> Saved!';
  btn.classList.add('bg-neon-green/20');
  setTimeout(() => { btn.innerHTML = originalText; btn.classList.remove('bg-neon-green/20'); }, 2000);
}

function loadReportFromLocalStorage() {
  const saved = localStorage.getItem('eoTechnicsReportDraft');
  if (!saved) {
    alert('No saved draft found. Start a new report.');
    return;
  }

  const data = JSON.parse(saved);
  document.getElementById('reportFSE').value = data.fse || '';
  document.getElementById('reportDate').value = data.date || '';
  document.getElementById('reportMachineId').value = data.machineId || '1';
  document.getElementById('reportWeek').value = data.week || '';
  document.getElementById('healthScore').value = data.healthScore || '92';
  document.getElementById('reportFindings').value = data.findings || '';
  document.getElementById('reportRootCause').value = data.rootCause || '';
  document.getElementById('reportActions').value = data.actions || '';
  document.getElementById('reportRecommendations').value = data.recommendations || '';
  document.getElementById('criticalPart').value = data.criticalPart || '';
  document.getElementById('criticalUrgency').value = data.criticalUrgency || 'ASAP';
  document.getElementById('criticalFinding').value = data.criticalFinding || '';
  document.getElementById('warningFinding').value = data.warningFinding || '';

  if (data.uvHours) {
    Object.keys(data.uvHours).forEach(m => {
      const el = document.getElementById('uvHours' + m);
      if (el) el.value = data.uvHours[m];
    });
  }

  if (data.cda) {
    document.getElementById('cdaBeforeD1').value = data.cda.beforeD1 || '';
    document.getElementById('cdaBeforeD2').value = data.cda.beforeD2 || '';
    document.getElementById('cdaBeforeD3').value = data.cda.beforeD3 || '';
    document.getElementById('cdaAfterD1').value = data.cda.afterD1 || '';
    document.getElementById('cdaAfterD2').value = data.cda.afterD2 || '';
    document.getElementById('cdaAfterD3').value = data.cda.afterD3 || '';
    document.getElementById('cdaNotes').value = data.cda.notes || '';
  }

  if (data.cooling) {
    Object.keys(data.cooling).forEach(key => {
      if (key.startsWith('ch')) {
        const c = key.replace('ch', '');
        document.getElementById('coolSet' + c).value = data.cooling[key].set || '';
        document.getElementById('coolAlarm' + c).value = data.cooling[key].alarm || '';
        document.getElementById('coolD1C' + c).value = data.cooling[key].d1 || '';
        document.getElementById('coolD2C' + c).value = data.cooling[key].d2 || '';
        document.getElementById('coolD3C' + c).value = data.cooling[key].d3 || '';
      }
    });
    document.getElementById('coolingNotes').value = data.cooling.notes || '';
  }

  if (data.parameters) reportState.parameters = data.parameters;
  if (data.images) reportState.images = data.images;

  updateHealthScoreDisplay();
  updateUVLaserDisplay();
  updateCDAGraph();
  updateCoolingDisplay();
  renderParameterEditList();
  updateCharts();

  // Show confirmation
  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-check mr-1"></i> Loaded!';
  btn.classList.add('bg-neon-green/20');
  setTimeout(() => { btn.innerHTML = originalText; btn.classList.remove('bg-neon-green/20'); }, 2000);
}

// ===================== MODAL FUNCTIONS =====================
function openReportGenerator() {
  renderParameterEditList();
  updateHealthScoreDisplay();
  updateUVLaserDisplay();
  updateSectionCount();
  openModalA11y('reportGeneratorModal');
  setTimeout(() => {
    updateCDAGraph();
    updateCoolingDisplay();
    updateCharts();
  }, 300);
}

function closeReportGenerator() {
  if (radarChart) { radarChart.destroy(); radarChart = null; }
  if (barChart) { barChart.destroy(); barChart = null; }
  if (trendChart) { trendChart.destroy(); trendChart = null; }
  if (cdaChart) { cdaChart.destroy(); cdaChart = null; }
  if (coolingChart) { coolingChart.destroy(); coolingChart = null; }
  closeModalA11y('reportGeneratorModal');
}

function updateMachinePreview() {}

// ===================== SECTION TOGGLE HELPERS =====================
function getSelectedSections() {
  const checkboxes = document.querySelectorAll('.report-section-toggle');
  const selected = {};
  checkboxes.forEach(cb => {
    selected[cb.dataset.section] = cb.checked;
  });
  return selected;
}

function selectAllSections(select) {
  document.querySelectorAll('.report-section-toggle').forEach(cb => {
    cb.checked = select;
  });
  updateSectionCount();
}

function updateSectionCount() {
  const count = document.querySelectorAll('.report-section-toggle:checked').length;
  const total = document.querySelectorAll('.report-section-toggle').length;
  const el = document.getElementById('sectionCount');
  if (el) el.textContent = count + ' of ' + total + ' sections selected';
}

// Auto-update count on checkbox change
document.addEventListener('change', function(e) {
  if (e.target.classList.contains('report-section-toggle')) {
    updateSectionCount();
  }
});

// ===================== REPORT GENERATION =====================
function copyReportLink() {
  const reportData = {
    fse: document.getElementById('reportFSE').value,
    date: document.getElementById('reportDate').value,
    machine: document.getElementById('reportMachineId').value,
    week: document.getElementById('reportWeek').value,
    savedAt: new Date().toISOString()
  };
  const link = window.location.href.split('?')[0] + '?report=' + btoa(JSON.stringify(reportData));
  navigator.clipboard.writeText(link).then(() => {
    const btn = event.target.closest('button');
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check mr-1"></i> Copied!';
    setTimeout(() => btn.innerHTML = original, 2000);
  });
}

function generateReportPreview() {
  saveParameters();
  const sections = getSelectedSections();
  const fse = document.getElementById('reportFSE').value;
  const date = document.getElementById('reportDate').value;
  const machineId = document.getElementById('reportMachineId').value;
  const week = document.getElementById('reportWeek').value;
  const healthScore = document.getElementById('healthScore').value;
  const findings = document.getElementById('reportFindings').value;
  const rootCause = document.getElementById('reportRootCause').value;
  const actions = document.getElementById('reportActions').value;
  const recommendations = document.getElementById('reportRecommendations').value;
  const criticalPart = document.getElementById('criticalPart').value;
  const criticalUrgency = document.getElementById('criticalUrgency').value;
  const criticalFinding = document.getElementById('criticalFinding').value;
  const warningFinding = document.getElementById('warningFinding').value;
  const machineName = 'Machine ' + machineId + ' (WLVIA #' + String(machineId).padStart(3, '0') + ')';

  const scoreColor = healthScore >= 90 ? '#16a34a' : healthScore >= 70 ? '#d97706' : '#dc2626';
  const scoreBg = healthScore >= 90 ? '#f0fdf4' : healthScore >= 70 ? '#fef3c7' : '#fef2f2';
  const paramColors = {
    'Pass': { bg: '#f0fdf4', border: '#86efac', text: '#16a34a', badge: '#22c55e' },
    'Fail': { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', badge: '#ef4444' },
    'Warning': { bg: '#fefce8', border: '#fde047', text: '#b45309', badge: '#f59e0b' }
  };

  function calcDueDate(currentHours) {
    const remaining = UV_LASER_MAX_HOURS - currentHours;
    const daysRemaining = Math.ceil(remaining / 8);
    const d = new Date();
    d.setDate(d.getDate() + daysRemaining);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  function calcDaysLeft(currentHours) {
    const remaining = UV_LASER_MAX_HOURS - currentHours;
    return Math.ceil(remaining / 8);
  }

  let reportHTML = '<div class="report-preview" style="padding: 40px; max-width: 1100px; margin: 0 auto;">';

  // ===== HEADER =====
  reportHTML += '<div style="text-align: center; border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px;">';
  reportHTML += '<h1 style="font-size: 28px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Machine Health Check Buyoff Report</h1>';
  reportHTML += '<p style="font-size: 14px; color: #64748b;">EO Technics FSE — Wafer Laser Via Health Check Service</p>';
  reportHTML += '<p style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Enhanced Report v2.0 — Visual Evidence, CDA, Cooling, UV Laser & Root Cause Analysis</p>';
  reportHTML += '</div>';

  // ===== BASIC INFO =====
  if (sections.basicInfo) {
    reportHTML += '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px;">';
    reportHTML += '<div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); padding: 16px; border-radius: 12px; border-left: 4px solid #3b82f6; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">';
    reportHTML += '<p style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">FSE Name</p>';
    reportHTML += '<p style="font-size: 14px; font-weight: 700; color: #1e293b;">' + fse + '</p></div>';
    reportHTML += '<div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); padding: 16px; border-radius: 12px; border-left: 4px solid #8b5cf6; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">';
    reportHTML += '<p style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Report Date</p>';
    reportHTML += '<p style="font-size: 14px; font-weight: 700; color: #1e293b;">' + date + '</p></div>';
    reportHTML += '<div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); padding: 16px; border-radius: 12px; border-left: 4px solid #22c55e; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">';
    reportHTML += '<p style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Machine ID</p>';
    reportHTML += '<p style="font-size: 14px; font-weight: 700; color: #1e293b;">' + machineName + '</p></div>';
    reportHTML += '<div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); padding: 16px; border-radius: 12px; border-left: 4px solid #f59e0b; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">';
    reportHTML += '<p style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Health Check Week</p>';
    reportHTML += '<p style="font-size: 14px; font-weight: 700; color: #1e293b;">' + week + '</p></div>';
    reportHTML += '</div>';
  }

  // ===== EXECUTIVE SUMMARY / HEALTH SCORE =====
  if (sections.executiveSummary) {
    reportHTML += '<div style="background: ' + scoreBg + '; border: 2px solid ' + scoreColor + '; border-radius: 16px; padding: 28px; margin-bottom: 28px; text-align: center; position: relative; overflow: hidden;">';
    reportHTML += '<div style="position: absolute; top: -20px; right: -20px; width: 120px; height: 120px; border-radius: 50%; background: ' + scoreColor + '; opacity: 0.05;"></div>';
    reportHTML += '<p style="font-size: 12px; color: ' + scoreColor + '; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em; margin-bottom: 12px;">Overall Machine Health Score</p>';
    reportHTML += '<p style="font-size: 56px; font-weight: 800; color: ' + scoreColor + '; font-family: monospace; line-height: 1;">' + healthScore + '<span style="font-size: 22px; font-weight: 600;">/100</span></p>';
    reportHTML += '<div style="display: flex; justify-content: center; gap: 4px; margin: 16px 0;">';
    for (let i = 0; i < 10; i++) {
      const filled = i < Math.floor(healthScore / 10);
      const barColor = filled ? scoreColor : '#e2e8f0';
      reportHTML += '<div style="width: 28px; height: 8px; background: ' + barColor + '; border-radius: 4px;"></div>';
    }
    reportHTML += '</div>';
    reportHTML += '<p style="font-size: 14px; color: #334155; max-width: 600px; margin: 0 auto; line-height: 1.6;">' + findings + '</p>';
    reportHTML += '</div>';
  }

  // ===== FLEET STATUS =====
  if (sections.fleetStatus) {
    reportHTML += '<div style="margin-bottom: 32px;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
    reportHTML += '<div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #00d4ff, #a855f7); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 16px;">&#128187;</span></div>';
    reportHTML += '<h2 style="font-size: 18px; font-weight: 700; color: #0f172a;">Machine Fleet Status</h2>';
    reportHTML += '</div>';
    reportHTML += '<div style="display: grid; grid-template-columns: repeat(' + appState.machineCount + ', 1fr); gap: 12px;">';
    for (let m = 1; m <= appState.machineCount; m++) {
      const mVisits = appState.visits.filter(v => v.machineNum === m);
      const done = mVisits.filter(v => v.status === 'Completed').length;
      const active = mVisits.filter(v => v.status === 'In Progress').length;
      const nextVisit = mVisits.find(v => v.status === 'Scheduled');
      let statusColor = '#22c55e', statusText = 'Scheduled', statusBg = '#f0fdf4', statusBorder = '#86efac';
      if (active > 0) { statusColor = '#f59e0b'; statusText = 'In Progress'; statusBg = '#fefce8'; statusBorder = '#fde047'; }
      else if (done > 0) { statusColor = '#16a34a'; statusText = 'Partial'; statusBg = '#f0fdf4'; statusBorder = '#86efac'; }
      reportHTML += '<div style="background: ' + statusBg + '; border: 1px solid ' + statusBorder + '; border-radius: 14px; padding: 16px; text-align: center;">';
      reportHTML += '<div style="width: 44px; height: 44px; border-radius: 50%; background: ' + statusColor + '15; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; border: 2px solid ' + statusColor + '40;">';
      reportHTML += '<span style="font-size: 16px; font-weight: 800; color: ' + statusColor + ';">' + m + '</span></div>';
      reportHTML += '<p style="font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">WLVIA #' + String(m).padStart(3, '0') + '</p>';
      reportHTML += '<span style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; background: ' + statusColor + '15; color: ' + statusColor + '; border: 1px solid ' + statusColor + '40;">' + statusText + '</span>';
      if (nextVisit) {
        reportHTML += '<p style="font-size: 10px; color: #64748b; margin-top: 6px;">Next: ' + nextVisit.week + '</p>';
      }
      reportHTML += '</div>';
    }
    reportHTML += '</div></div>';
  }

  // ===== UV LASER LIFE MONITOR =====
  if (sections.uvLaser) {
    reportHTML += '<div style="margin-bottom: 32px;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
    reportHTML += '<div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #ef4444, #dc2626); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 16px;">&#128308;</span></div>';
    reportHTML += '<h2 style="font-size: 18px; font-weight: 700; color: #0f172a;">UV Laser Life Monitor</h2>';
    reportHTML += '<span style="font-size: 12px; color: #94a3b8; margin-left: auto; background: #f1f5f9; padding: 4px 12px; border-radius: 20px;">Max Life: 25,000h</span>';
    reportHTML += '</div>';
    const uvMachines = ['M1', 'M2', 'M3', 'M4', 'M5'];
    reportHTML += '<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;">';
    uvMachines.forEach(m => {
      const hours = parseInt(document.getElementById('uvHours' + m).value) || 0;
      const remaining = UV_LASER_MAX_HOURS - hours;
      const pct = ((hours / UV_LASER_MAX_HOURS) * 100).toFixed(0);
      const daysLeft = calcDaysLeft(hours);
      const dueDate = calcDueDate(hours);
      let cardBorder, cardBg, accentColor, statusText, statusIcon;
      if (hours >= UV_LASER_MAX_HOURS) {
        cardBorder = 'rgba(239,68,68,0.4)'; cardBg = 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))'; accentColor = '#ef4444';
        statusText = 'ALARM'; statusIcon = '&#128308;';
      } else if (hours >= UV_LASER_WARNING) {
        cardBorder = 'rgba(245,158,11,0.4)'; cardBg = 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))'; accentColor = '#f59e0b';
        statusText = 'WARNING'; statusIcon = '&#9888;';
      } else {
        cardBorder = 'rgba(34,197,94,0.3)'; cardBg = 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(34,197,94,0.02))'; accentColor = '#22c55e';
        statusText = 'HEALTHY'; statusIcon = '&#10003;';
      }
      reportHTML += '<div style="background: ' + cardBg + '; border: 1px solid ' + cardBorder + '; border-radius: 16px; padding: 16px; text-align: center; position: relative; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">';
      reportHTML += '<div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, ' + accentColor + ', ' + accentColor + '66);"></div>';
      reportHTML += '<div style="width: 44px; height: 44px; border-radius: 50%; background: ' + accentColor + '15; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; border: 2px solid ' + accentColor + '40;">';
      reportHTML += '<span style="font-size: 16px; font-weight: 800; color: ' + accentColor + ';">' + m.replace('M', '') + '</span></div>';
      reportHTML += '<p style="font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Current Hours</p>';
      reportHTML += '<p style="font-size: 20px; font-weight: 800; color: ' + accentColor + '; margin-bottom: 6px; font-family: monospace;">' + hours.toLocaleString() + '</p>';
      reportHTML += '<div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; margin: 8px 0; overflow: hidden;">';
      reportHTML += '<div style="width: ' + pct + '%; height: 100%; background: linear-gradient(90deg, ' + accentColor + ', ' + accentColor + '99); border-radius: 3px; transition: width 0.5s;"></div></div>';
      reportHTML += '<p style="font-size: 11px; color: ' + accentColor + '; font-weight: 700;">' + statusIcon + ' ' + remaining.toLocaleString() + 'h left</p>';
      reportHTML += '<div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed ' + cardBorder + ';">';
      reportHTML += '<p style="font-size: 10px; color: #64748b;">Due: <strong style="color: #334155;">' + dueDate + '</strong></p>';
      reportHTML += '<p style="font-size: 10px; color: #64748b;">~' + daysLeft + ' work days</p>';
      reportHTML += '</div></div>';
    });
    reportHTML += '</div></div>';
  }

  // ===== CRITICAL FINDINGS =====
  if (sections.criticalFindings) {
    reportHTML += '<div style="margin-bottom: 32px;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
    reportHTML += '<div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #ef4444, #dc2626); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 16px;">&#128680;</span></div>';
    reportHTML += '<h2 style="font-size: 18px; font-weight: 700; color: #0f172a;">Critical Findings & Alerts</h2>';
    reportHTML += '</div>';
    if (criticalUrgency === 'ASAP') {
      reportHTML += '<div style="background: linear-gradient(135deg, #fef2f2, #fee2e2); border: 1px solid #fecaca; border-radius: 16px; padding: 20px; margin-bottom: 12px; position: relative; overflow: hidden;">';
      reportHTML += '<div style="position: absolute; top: 0; right: 0; width: 80px; height: 80px; background: #ef4444; opacity: 0.03; border-radius: 0 0 0 80px;"></div>';
      reportHTML += '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">';
      reportHTML += '<div style="width: 28px; height: 28px; border-radius: 8px; background: #ef4444; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 14px;">&#128308;</span></div>';
      reportHTML += '<span style="font-size: 14px; font-weight: 700; color: #dc2626;">URGENT: ' + criticalPart + ' — IMMEDIATE REPLACEMENT REQUIRED</span></div>';
      reportHTML += '<div style="display: flex; gap: 8px; margin-bottom: 10px;">';
      reportHTML += '<span style="font-size: 11px; padding: 3px 10px; background: #fecaca; color: #dc2626; border-radius: 20px; font-weight: 600;">ASAP</span>';
      reportHTML += '<span style="font-size: 11px; padding: 3px 10px; background: #fee2e2; color: #991b1b; border-radius: 20px;">Critical Priority</span></div>';
      reportHTML += '<p style="font-size: 13px; color: #7f1d1d; line-height: 1.7;">' + criticalFinding + '</p>';
      reportHTML += '</div>';
    }
    reportHTML += '<div style="background: linear-gradient(135deg, #fefce8, #fef9c3); border: 1px solid #fde047; border-radius: 16px; padding: 20px; position: relative; overflow: hidden;">';
    reportHTML += '<div style="position: absolute; top: 0; right: 0; width: 80px; height: 80px; background: #f59e0b; opacity: 0.03; border-radius: 0 0 0 80px;"></div>';
    reportHTML += '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">';
    reportHTML += '<div style="width: 28px; height: 28px; border-radius: 8px; background: #f59e0b; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 14px;">&#9888;</span></div>';
    reportHTML += '<span style="font-size: 14px; font-weight: 700; color: #b45309;">WARNING: Lens Condition Monitoring</span></div>';
    reportHTML += '<div style="display: flex; gap: 8px; margin-bottom: 10px;">';
    reportHTML += '<span style="font-size: 11px; padding: 3px 10px; background: #fde047; color: #854d0e; border-radius: 20px; font-weight: 600;">Monitor</span>';
    reportHTML += '<span style="font-size: 11px; padding: 3px 10px; background: #fef9c3; color: #a16207; border-radius: 20px;">Next Quarter</span></div>';
    reportHTML += '<p style="font-size: 13px; color: #78350f; line-height: 1.7;">' + warningFinding + '</p>';
    reportHTML += '</div></div>';
  }

  // ===== CDA MONITORING =====
  if (sections.cdaMonitoring) {
    reportHTML += '<div style="margin-bottom: 32px;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
    reportHTML += '<div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #3b82f6, #2563eb); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 16px;">&#128168;</span></div>';
    reportHTML += '<h2 style="font-size: 18px; font-weight: 700; color: #0f172a;">CDA (Clean Dry Air) Pressure Monitoring</h2>';
    reportHTML += '</div>';
    const cdaBefore = [parseFloat(document.getElementById('cdaBeforeD1').value), parseFloat(document.getElementById('cdaBeforeD2').value), parseFloat(document.getElementById('cdaBeforeD3').value)];
    const cdaAfter = [parseFloat(document.getElementById('cdaAfterD1').value), parseFloat(document.getElementById('cdaAfterD2').value), parseFloat(document.getElementById('cdaAfterD3').value)];
    const cdaBeforeAvg = (cdaBefore.reduce((a,b) => a+b, 0) / 3).toFixed(1);
    const cdaAfterAvg = (cdaAfter.reduce((a,b) => a+b, 0) / 3).toFixed(1);
    const cdaImprovement = (cdaAfterAvg - cdaBeforeAvg).toFixed(1);
    reportHTML += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">';
    reportHTML += '<div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; position: relative;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
    reportHTML += '<div style="width: 32px; height: 32px; border-radius: 8px; background: #94a3b8; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 14px;">&#128202;</span></div>';
    reportHTML += '<span style="font-size: 14px; font-weight: 700; color: #64748b;">Before Service</span></div>';
    reportHTML += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px;">';
    cdaBefore.forEach((v, i) => {
      reportHTML += '<div style="text-align: center; padding: 12px 8px; background: white; border-radius: 10px; border: 1px solid #e2e8f0;">';
      reportHTML += '<p style="font-size: 10px; color: #94a3b8; margin-bottom: 4px;">Day ' + (i+1) + '</p>';
      reportHTML += '<p style="font-size: 20px; font-weight: 800; color: #475569;">' + v + '</p>';
      reportHTML += '<p style="font-size: 10px; color: #94a3b8;">kPa</p></div>';
    });
    reportHTML += '</div>';
    reportHTML += '<div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #fef2f2; border-radius: 10px; border: 1px solid #fecaca;">';
    reportHTML += '<span style="font-size: 12px; color: #dc2626; font-weight: 600;">&#9888; Low Pressure</span>';
    reportHTML += '<span style="font-size: 16px; font-weight: 800; color: #dc2626;">' + cdaBeforeAvg + ' <span style="font-size: 11px; font-weight: 500;">kPa avg</span></span></div>';
    reportHTML += '</div>';
    reportHTML += '<div style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border: 1px solid #bae6fd; border-radius: 16px; padding: 20px; position: relative;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
    reportHTML += '<div style="width: 32px; height: 32px; border-radius: 8px; background: #3b82f6; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 14px;">&#9989;</span></div>';
    reportHTML += '<span style="font-size: 14px; font-weight: 700; color: #1e40af;">After Service</span></div>';
    reportHTML += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px;">';
    cdaAfter.forEach((v, i) => {
      reportHTML += '<div style="text-align: center; padding: 12px 8px; background: white; border-radius: 10px; border: 1px solid #bae6fd;">';
      reportHTML += '<p style="font-size: 10px; color: #3b82f6; margin-bottom: 4px;">Day ' + (i+1) + '</p>';
      reportHTML += '<p style="font-size: 20px; font-weight: 800; color: #2563eb;">' + v + '</p>';
      reportHTML += '<p style="font-size: 10px; color: #60a5fa;">kPa</p></div>';
    });
    reportHTML += '</div>';
    reportHTML += '<div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #f0fdf4; border-radius: 10px; border: 1px solid #bbf7d0;">';
    reportHTML += '<span style="font-size: 12px; color: #16a34a; font-weight: 600;">&#10003; Optimal</span>';
    reportHTML += '<span style="font-size: 16px; font-weight: 800; color: #16a34a;">' + cdaAfterAvg + ' <span style="font-size: 11px; font-weight: 500;">kPa avg</span></span></div>';
    reportHTML += '</div></div>';
    reportHTML += '<div style="display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 16px;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #86efac; border-radius: 12px;">';
    reportHTML += '<span style="font-size: 20px;">&#128200;</span>';
    reportHTML += '<div><p style="font-size: 11px; color: #166534; font-weight: 600;">Pressure Improvement</p><p style="font-size: 18px; font-weight: 800; color: #16a34a;">+' + cdaImprovement + ' kPa</p></div>';
    reportHTML += '</div></div>';
    reportHTML += '<div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 0 12px 12px 0; padding: 14px 18px;">';
    reportHTML += '<p style="font-size: 12px; color: #1e40af; line-height: 1.7;"><strong>Assessment:</strong> ' + document.getElementById('cdaNotes').value + '</p>';
    reportHTML += '</div></div>';
  }

  // ===== COOLING SYSTEM =====
  if (sections.coolingSystem) {
    reportHTML += '<div style="margin-bottom: 32px;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
    reportHTML += '<div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #f59e0b, #d97706); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 16px;">&#127777;</span></div>';
    reportHTML += '<h2 style="font-size: 18px; font-weight: 700; color: #0f172a;">Cooling System Temperature Monitoring (6 Channels)</h2>';
    reportHTML += '</div>';
    const channelNames = ['Laser Head', 'Scanner', 'Stage X', 'Stage Y', 'Power Supply', 'Ambient'];
    const channelColors = ['#00d4ff', '#a855f7', '#f59e0b', '#22c55e', '#ef4444', '#64748b'];
    reportHTML += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;">';
    for (let c = 1; c <= 6; c++) {
      const setVal = parseFloat(document.getElementById('coolSet' + c).value) || 0;
      const alarmVal = parseFloat(document.getElementById('coolAlarm' + c).value) || 0;
      const d1 = parseFloat(document.getElementById('coolD1C' + c).value) || 0;
      const d2 = parseFloat(document.getElementById('coolD2C' + c).value) || 0;
      const d3 = parseFloat(document.getElementById('coolD3C' + c).value) || 0;
      const maxTemp = Math.max(d1, d2, d3);
      const color = channelColors[c-1];
      let statusText, statusBg, statusBorder;
      if (maxTemp >= alarmVal) {
        statusText = '&#128308; ALARM'; statusBg = '#fef2f2'; statusBorder = '#fecaca';
      } else if (maxTemp >= setVal + (alarmVal - setVal) * 0.7) {
        statusText = '&#9888; WARM'; statusBg = '#fefce8'; statusBorder = '#fde047';
      } else {
        statusText = '&#10003; OK'; statusBg = '#f0fdf4'; statusBorder = '#bbf7d0';
      }
      reportHTML += '<div style="background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; position: relative; overflow: hidden;">';
      reportHTML += '<div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: ' + color + ';"></div>';
      reportHTML += '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">';
      reportHTML += '<span style="font-size: 12px; font-weight: 700; color: #1e293b;">Ch ' + c + ' — ' + channelNames[c-1] + '</span>';
      reportHTML += '<span style="font-size: 10px; padding: 2px 8px; border-radius: 20px; background: ' + statusBg + '; color: ' + (statusText.includes('ALARM') ? '#dc2626' : statusText.includes('WARM') ? '#b45309' : '#16a34a') + '; border: 1px solid ' + statusBorder + '; font-weight: 600;">' + statusText + '</span></div>';
      reportHTML += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 10px;">';
      [d1, d2, d3].forEach((v, i) => {
        reportHTML += '<div style="text-align: center; padding: 8px 4px; background: #f8fafc; border-radius: 8px;">';
        reportHTML += '<p style="font-size: 9px; color: #94a3b8;">Day ' + (i+1) + '</p>';
        reportHTML += '<p style="font-size: 14px; font-weight: 700; color: #334155;">' + v + '°C</p></div>';
      });
      reportHTML += '</div>';
      reportHTML += '<div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b;">';
      reportHTML += '<span>Set: <strong>' + setVal + '°C</strong></span>';
      reportHTML += '<span>Alarm: <strong>' + alarmVal + '°C</strong></span></div>';
      reportHTML += '</div>';
    }
    reportHTML += '</div>';
    reportHTML += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">';
    reportHTML += '<div style="background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 12px 12px 0; padding: 14px 18px;">';
    reportHTML += '<p style="font-size: 11px; color: #92400e; font-weight: 600; margin-bottom: 4px;">&#128221; Assessment</p>';
    reportHTML += '<p style="font-size: 12px; color: #78350f; line-height: 1.6;">' + document.getElementById('coolingNotes').value + '</p>';
    reportHTML += '</div>';
    const coolingImg = reportState.images['slot-cooling'];
    if (coolingImg) {
      reportHTML += '<div style="background: white; border-radius: 12px; padding: 12px; border: 1px solid #e2e8f0; text-align: center;">';
      reportHTML += '<img src="' + coolingImg + '" style="max-width: 100%; max-height: 150px; border-radius: 8px;">';
      reportHTML += '<p style="font-size: 10px; color: #94a3b8; margin-top: 6px; font-style: italic;">Cooling System Temperature Graph</p></div>';
    }
    reportHTML += '</div></div>';
  }

  // ===== VISUAL EVIDENCE (Report Generator Images) =====
  if (sections.visualEvidence) {
    reportHTML += '<div style="margin-bottom: 32px;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
    reportHTML += '<div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #a855f7, #7c3aed); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 16px;">&#128247;</span></div>';
    reportHTML += '<h2 style="font-size: 18px; font-weight: 700; color: #0f172a;">Visual Evidence — Before & After Comparison</h2>';
    reportHTML += '</div>';
    const imageSections = [
      { key: 'beam', title: 'Laser Beam Profile', icon: '&#9889;', color: '#3b82f6' },
      { key: 'via', title: 'Via Size Diameter', icon: '&#9679;', color: '#a855f7' },
      { key: 'shape', title: 'Via Shape (Top View)', icon: '&#9675;', color: '#f59e0b' },
      { key: 'pad', title: 'Pad Quality Inspection', icon: '&#10003;', color: '#22c55e' }
    ];
    reportHTML += '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px;">';
    imageSections.forEach(section => {
      const beforeImg = reportState.images['slot-' + section.key + '-before'];
      const afterImg = reportState.images['slot-' + section.key + '-after'];
      reportHTML += '<div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">';
      reportHTML += '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">';
      reportHTML += '<div style="width: 28px; height: 28px; border-radius: 8px; background: ' + section.color + '15; display: flex; align-items: center; justify-content: center; border: 1px solid ' + section.color + '30;">';
      reportHTML += '<span style="font-size: 14px;">' + section.icon + '</span></div>';
      reportHTML += '<span style="font-size: 13px; font-weight: 700; color: #1e293b;">' + section.title + '</span></div>';
      reportHTML += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">';
      if (beforeImg) {
        reportHTML += '<div style="background: #f8fafc; border-radius: 12px; padding: 10px; text-align: center; border: 1px dashed #cbd5e1;">';
        reportHTML += '<img src="' + beforeImg + '" style="max-width: 100%; max-height: 140px; border-radius: 8px;">';
        reportHTML += '<p style="font-size: 10px; color: #94a3b8; margin-top: 6px; font-style: italic;">BEFORE — Baseline</p></div>';
      } else {
        reportHTML += '<div style="background: #f8fafc; border-radius: 12px; padding: 10px; text-align: center; border: 1px dashed #cbd5e1; min-height: 140px; display: flex; align-items: center; justify-content: center;">';
        reportHTML += '<p style="font-size: 11px; color: #94a3b8;">[Before image not uploaded]</p></div>';
      }
      if (afterImg) {
        reportHTML += '<div style="background: #f0fdf4; border-radius: 12px; padding: 10px; text-align: center; border: 1px dashed ' + section.color + '50;">';
        reportHTML += '<img src="' + afterImg + '" style="max-width: 100%; max-height: 140px; border-radius: 8px;">';
        reportHTML += '<p style="font-size: 10px; color: ' + section.color + '; margin-top: 6px; font-style: italic;">AFTER — Post-Service</p></div>';
      } else {
        reportHTML += '<div style="background: #f0fdf4; border-radius: 12px; padding: 10px; text-align: center; border: 1px dashed ' + section.color + '50; min-height: 140px; display: flex; align-items: center; justify-content: center;">';
        reportHTML += '<p style="font-size: 11px; color: ' + section.color + ';">[After image not uploaded]</p></div>';
      }
      reportHTML += '</div></div>';
    });
    reportHTML += '</div>';
    const calImg = reportState.images['slot-calibration'];
    if (calImg) {
      reportHTML += '<div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; margin-bottom: 16px;">';
      reportHTML += '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">';
      reportHTML += '<div style="width: 28px; height: 28px; border-radius: 8px; background: #3b82f615; display: flex; align-items: center; justify-content: center; border: 1px solid #3b82f630;">';
      reportHTML += '<span style="font-size: 14px;">&#128203;</span></div>';
      reportHTML += '<span style="font-size: 13px; font-weight: 700; color: #1e293b;">Calibration Report Screenshot</span></div>';
      reportHTML += '<div style="text-align: center;"><img src="' + calImg + '" style="max-width: 100%; max-height: 300px; border-radius: 8px;"></div>';
      reportHTML += '</div>';
    }
    reportHTML += '</div>';
  }

  // ===== LASER POWER MONITOR =====
  if (sections.laserPower) {
    reportHTML += '<div style="margin-bottom: 32px; page-break-before: always;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
    reportHTML += '<div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #00d4ff, #a855f7); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 16px;">&#9889;</span></div>';
    reportHTML += '<h2 style="font-size: 18px; font-weight: 700; color: #0f172a;">Laser Power Monitor</h2>';
    reportHTML += '<span style="font-size: 12px; color: #94a3b8; margin-left: auto; background: #f1f5f9; padding: 4px 12px; border-radius: 20px;">2 Sources × 6 Masks</span>';
    reportHTML += '</div>';
    ['laser1', 'laser2'].forEach(laserKey => {
      const laser = appState.laserPowerMonitor[laserKey];
      reportHTML += '<div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 16px;">';
      reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
      reportHTML += '<div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #00d4ff, #a855f7); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 14px;">&#9889;</span></div>';
      reportHTML += '<div><p style="font-size: 14px; font-weight: 700; color: #1e293b;">' + laser.name + '</p><p style="font-size: 11px; color: #94a3b8;">' + laser.serial + ' • ' + laser.wavelength + '</p></div></div>';
      reportHTML += '<table style="width:100%; border-collapse: collapse; font-size: 12px;">';
      reportHTML += '<thead><tr style="background: #f1f5f9;"><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Mask</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Aperture</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Before (W)</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">After (W)</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Spec Range</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">Status</th></tr></thead><tbody>';
      laser.masks.forEach(mask => {
        const statusColor = mask.status === 'Pass' ? '#16a34a' : '#dc2626';
        const statusBg = mask.status === 'Pass' ? '#f0fdf4' : '#fef2f2';
        reportHTML += '<tr>';
        reportHTML += '<td style="padding: 10px; border: 1px solid #e2e8f0;">' + mask.idx + '</td>';
        reportHTML += '<td style="padding: 10px; border: 1px solid #e2e8f0;">' + mask.aperture + '</td>';
        reportHTML += '<td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; color: #64748b;">' + mask.beforePower + '</td>';
        reportHTML += '<td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: ' + statusColor + ';">' + mask.afterPower + '</td>';
        reportHTML += '<td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; color: #3b82f6;">' + mask.specMin + '-' + mask.specMax + 'W</td>';
        reportHTML += '<td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;"><span style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; background: ' + statusBg + '; color: ' + statusColor + '; border: 1px solid ' + statusColor + '40;">' + mask.status + '</span></td>';
        reportHTML += '</tr>';
      });
      reportHTML += '</tbody></table></div>';
    });
    reportHTML += '</div>';
  }

  // ===== LASER PROFILE MONITOR =====
  if (sections.laserProfile) {
    reportHTML += '<div style="margin-bottom: 32px;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
    reportHTML += '<div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #a855f7, #ec4899); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 16px;">&#128200;</span></div>';
    reportHTML += '<h2 style="font-size: 18px; font-weight: 700; color: #0f172a;">Laser Profile Monitor</h2>';
    reportHTML += '</div>';
    const lp = appState.laserProfile;
    reportHTML += '<div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 16px;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
    reportHTML += '<div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #a855f7, #ec4899); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 14px;">&#128187;</span></div>';
    reportHTML += '<div><p style="font-size: 14px; font-weight: 700; color: #1e293b;">Current Running Product</p><p style="font-size: 11px; color: #94a3b8;">' + lp.productName + ' • ' + lp.waferSize + '</p></div></div>';
    reportHTML += '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px;">';
    reportHTML += '<div style="text-align: center; padding: 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;"><p style="font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Product</p><p style="font-size: 14px; font-weight: 700; color: #7c3aed;">' + lp.productName + '</p></div>';
    reportHTML += '<div style="text-align: center; padding: 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;"><p style="font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Wafer Size</p><p style="font-size: 14px; font-weight: 700; color: #1e293b;">' + lp.waferSize + '</p></div>';
    reportHTML += '<div style="text-align: center; padding: 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;"><p style="font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Aperture</p><p style="font-size: 14px; font-weight: 700; color: #f59e0b;">' + lp.laser1.aperture + '</p></div>';
    reportHTML += '<div style="text-align: center; padding: 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;"><p style="font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Mask Index</p><p style="font-size: 14px; font-weight: 700; color: #3b82f6;">#' + lp.laser1.maskIndex + '</p></div>';
    reportHTML += '</div>';
    reportHTML += '<table style="width:100%; border-collapse: collapse; font-size: 12px;">';
    reportHTML += '<thead><tr style="background: #f1f5f9;"><th style="padding: 10px; border: 1px solid #cbd5e1;">Laser</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Power P1 (W)</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Power P2 (W)</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Shots P1</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Shots P2</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Freq (kHz)</th></tr></thead><tbody>';
    reportHTML += '<tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 700; color: #3b82f6;">Laser Source 1</td><td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">' + lp.laser1.powerPhase1 + '</td><td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">' + lp.laser1.powerPhase2 + '</td><td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">' + lp.laser1.shotsPhase1.toLocaleString() + '</td><td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">' + lp.laser1.shotsPhase2.toLocaleString() + '</td><td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">' + lp.laser1.frequency + '</td></tr>';
    reportHTML += '<tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 700; color: #a855f7;">Laser Source 2</td><td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">' + lp.laser2.powerPhase1 + '</td><td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">' + lp.laser2.powerPhase2 + '</td><td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">' + lp.laser2.shotsPhase1.toLocaleString() + '</td><td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">' + lp.laser2.shotsPhase2.toLocaleString() + '</td><td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">' + lp.laser2.frequency + '</td></tr>';
    reportHTML += '</tbody></table></div>';
    reportHTML += '</div>';
  }

  // ===== VIA IMAGE COMPARISON =====
  if (sections.viaImages) {
    reportHTML += '<div style="margin-bottom: 32px; page-break-before: always;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
    reportHTML += '<div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #f59e0b, #ea580c); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 16px;">&#128300;</span></div>';
    reportHTML += '<h2 style="font-size: 18px; font-weight: 700; color: #0f172a;">Via Image Comparison Report</h2>';
    reportHTML += '</div>';
    const vi = appState.viaImages;
    // Before/After image grids
    reportHTML += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">';
    reportHTML += '<div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px;">';
    reportHTML += '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">';
    reportHTML += '<span style="font-size: 13px; font-weight: 700; color: #64748b;"><i class="fas fa-image mr-1"></i> Before (' + vi.beforeImgs.length + ')</span>';
    reportHTML += '<span style="font-size: 11px; color: #94a3b8;">' + vi.beforeDate + '</span></div>';
    if (vi.beforeImgs.length > 0) {
      reportHTML += '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">';
      vi.beforeImgs.forEach(img => {
        reportHTML += '<div style="background: #f8fafc; border-radius: 10px; padding: 8px; text-align: center; border: 1px dashed #cbd5e1;">';
        reportHTML += '<img src="' + img + '" style="max-width: 100%; max-height: 160px; border-radius: 6px;">';
        reportHTML += '<p style="font-size: 9px; color: #94a3b8; margin-top: 4px; font-style: italic;">Before — Baseline</p></div>';
      });
      reportHTML += '</div>';
    } else {
      reportHTML += '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">';
      reportHTML += '<div style="background: #f8fafc; border-radius: 10px; min-height: 120px; display: flex; align-items: center; justify-content: center; border: 1px dashed #cbd5e1;"><span style="font-size: 11px; color: #94a3b8;">No image</span></div>';
      reportHTML += '<div style="background: #f8fafc; border-radius: 10px; min-height: 120px; display: flex; align-items: center; justify-content: center; border: 1px dashed #cbd5e1;"><span style="font-size: 11px; color: #94a3b8;">No image</span></div>';
      reportHTML += '</div>';
    }
    reportHTML += '</div>';
    reportHTML += '<div style="background: white; border: 1px solid #86efac; border-radius: 16px; padding: 16px;">';
    reportHTML += '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">';
    reportHTML += '<span style="font-size: 13px; font-weight: 700; color: #16a34a;"><i class="fas fa-image mr-1"></i> After (' + vi.afterImgs.length + ')</span>';
    reportHTML += '<span style="font-size: 11px; color: #94a3b8;">' + vi.afterDate + '</span></div>';
    if (vi.afterImgs.length > 0) {
      reportHTML += '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">';
      vi.afterImgs.forEach(img => {
        reportHTML += '<div style="background: #f0fdf4; border-radius: 10px; padding: 8px; text-align: center; border: 1px dashed #86efac;">';
        reportHTML += '<img src="' + img + '" style="max-width: 100%; max-height: 160px; border-radius: 6px;">';
        reportHTML += '<p style="font-size: 9px; color: #16a34a; margin-top: 4px; font-style: italic;">After — Post-Service</p></div>';
      });
      reportHTML += '</div>';
    } else {
      reportHTML += '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">';
      reportHTML += '<div style="background: #f0fdf4; border-radius: 10px; min-height: 120px; display: flex; align-items: center; justify-content: center; border: 1px dashed #86efac;"><span style="font-size: 11px; color: #16a34a;">No image</span></div>';
      reportHTML += '<div style="background: #f0fdf4; border-radius: 10px; min-height: 120px; display: flex; align-items: center; justify-content: center; border: 1px dashed #86efac;"><span style="font-size: 11px; color: #16a34a;">No image</span></div>';
      reportHTML += '</div>';
    }
    reportHTML += '</div></div>';
    // Metrics table
    reportHTML += '<table style="width:100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px;">';
    reportHTML += '<thead><tr style="background: #f1f5f9;"><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Metric</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Before</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">After</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Spec</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">Status</th></tr></thead><tbody>';
    const viaMetrics = [
      { label: 'Top Diameter', before: vi.topDiameter.before, after: vi.topDiameter.after, spec: vi.topDiameter.spec },
      { label: 'Bottom Diameter', before: vi.bottomDiameter.before, after: vi.bottomDiameter.after, spec: vi.bottomDiameter.spec },
      { label: 'Roundness', before: vi.roundness.before, after: vi.roundness.after, spec: vi.roundness.spec },
      { label: 'Shape', before: vi.shape.before, after: vi.shape.after, spec: vi.shape.spec }
    ];
    viaMetrics.forEach(m => {
      const ok = m.after !== '-' && m.after !== '';
      const statusColor = ok ? '#16a34a' : '#dc2626';
      const statusBg = ok ? '#f0fdf4' : '#fef2f2';
      reportHTML += '<tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">' + m.label + '</td>';
      reportHTML += '<td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; color: #64748b;">' + m.before + '</td>';
      reportHTML += '<td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: ' + statusColor + ';">' + m.after + '</td>';
      reportHTML += '<td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; color: #3b82f6;">' + m.spec + '</td>';
      reportHTML += '<td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;"><span style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; background: ' + statusBg + '; color: ' + statusColor + '; border: 1px solid ' + statusColor + '40;">' + (ok ? 'PASS' : 'N/A') + '</span></td></tr>';
    });
    reportHTML += '</tbody></table>';
    if (vi.notes) {
      reportHTML += '<div style="background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 12px 12px 0; padding: 12px 16px;">';
      reportHTML += '<p style="font-size: 12px; color: #78350f;"><strong>Notes:</strong> ' + vi.notes + '</p></div>';
    }
    reportHTML += '</div>';
  }

  // ===== BEAM PROFILE MONITOR =====
  if (sections.beamProfile) {
    reportHTML += '<div style="margin-bottom: 32px; page-break-before: always;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
    reportHTML += '<div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #22c55e, #16a34a); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 16px;">&#127919;</span></div>';
    reportHTML += '<h2 style="font-size: 18px; font-weight: 700; color: #0f172a;">Beam Profile Monitor Report</h2>';
    reportHTML += '<span style="font-size: 12px; color: #94a3b8; margin-left: auto; background: #f1f5f9; padding: 4px 12px; border-radius: 20px;">2 Lasers × Dynamic Masks</span>';
    reportHTML += '</div>';
    ['laser1', 'laser2'].forEach(laserKey => {
      const laser = appState.beamProfiles[laserKey];
      reportHTML += '<div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 16px;">';
      reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
      reportHTML += '<div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #22c55e, #16a34a); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 14px;">&#127919;</span></div>';
      reportHTML += '<p style="font-size: 14px; font-weight: 700; color: #1e293b;">' + laser.title + '</p></div>';
      reportHTML += '<table style="width:100%; border-collapse: collapse; font-size: 12px;">';
      reportHTML += '<thead><tr style="background: #f1f5f9;"><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Mask</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Size Before</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Size After</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Dia Before</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Dia After</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">Status</th></tr></thead><tbody>';
      laser.items.forEach(mask => {
        const sizeOk = parseFloat(mask.beamSizeAfter) >= parseFloat(mask.specSize.split('-')[0]) && parseFloat(mask.beamSizeAfter) <= parseFloat(mask.specSize.split('-')[1]);
        const diaOk = parseFloat(mask.beamDiaAfter) >= parseFloat(mask.specDia.split('-')[0]) && parseFloat(mask.beamDiaAfter) <= parseFloat(mask.specDia.split('-')[1]);
        const allOk = sizeOk && diaOk;
        const statusColor = allOk ? '#16a34a' : '#dc2626';
        const statusBg = allOk ? '#f0fdf4' : '#fef2f2';
        reportHTML += '<tr><td style="padding: 10px; border: 1px solid #e2e8f0;">' + mask.title + '</td>';
        reportHTML += '<td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; color: #64748b;">' + mask.beamSizeBefore + '</td>';
        reportHTML += '<td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: ' + (sizeOk ? '#16a34a' : '#dc2626') + ';">' + mask.beamSizeAfter + '</td>';
        reportHTML += '<td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; color: #64748b;">' + mask.beamDiaBefore + '</td>';
        reportHTML += '<td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: ' + (diaOk ? '#16a34a' : '#dc2626') + ';">' + mask.beamDiaAfter + '</td>';
        reportHTML += '<td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;"><span style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; background: ' + statusBg + '; color: ' + statusColor + '; border: 1px solid ' + statusColor + '40;">' + (allOk ? 'PASS' : 'FAIL') + '</span></td></tr>';
      });
      reportHTML += '</tbody></table></div>';
    });
    reportHTML += '</div>';
  }

  // ===== SPARE PARTS =====
  if (sections.spareParts) {
    reportHTML += '<div style="margin-bottom: 32px;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
    reportHTML += '<div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #64748b, #475569); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 16px;">&#128295;</span></div>';
    reportHTML += '<h2 style="font-size: 18px; font-weight: 700; color: #0f172a;">Spare Parts & Consumables Assessment</h2>';
    reportHTML += '</div>';
    reportHTML += '<table style="width:100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px;">';
    reportHTML += '<thead><tr style="background: #f1f5f9;"><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Part</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Machine</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Cost</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">Replace By</th><th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">Status</th></tr></thead><tbody>';
    appState.spareParts.forEach(sp => {
      let urgencyColor = '#94a3b8', urgencyBg = '#f8fafc', urgencyBorder = '#e2e8f0';
      if (sp.replaceBy === 'ASAP') { urgencyColor = '#dc2626'; urgencyBg = '#fef2f2'; urgencyBorder = '#fecaca'; }
      else if (sp.replaceBy === 'Next quarter') { urgencyColor = '#f59e0b'; urgencyBg = '#fefce8'; urgencyBorder = '#fde047'; }
      let statusColor = '#64748b', statusBg = '#f8fafc';
      if (sp.status === 'Monitor') { statusColor = '#16a34a'; statusBg = '#f0fdf4'; }
      else if (sp.status === 'Plan Order') { statusColor = '#f59e0b'; statusBg = '#fefce8'; }
      else if (sp.status === 'OK') { statusColor = '#3b82f6'; statusBg = '#eff6ff'; }
      else if (sp.status === 'Critical') { statusColor = '#dc2626'; statusBg = '#fef2f2'; }
      reportHTML += '<tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">' + sp.part + '</td>';
      reportHTML += '<td style="padding: 10px; border: 1px solid #e2e8f0;">' + sp.machine + '</td>';
      reportHTML += '<td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">' + sp.cost + '</td>';
      reportHTML += '<td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;"><span style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; background: ' + urgencyBg + '; color: ' + urgencyColor + '; border: 1px solid ' + urgencyBorder + ';">' + sp.replaceBy + '</span></td>';
      reportHTML += '<td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;"><span style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; background: ' + statusBg + '; color: ' + statusColor + '; border: 1px solid ' + statusColor + '40;">' + sp.status + '</span></td></tr>';
    });
    reportHTML += '</tbody></table>';
    // Critical findings from spare parts
    const asapParts = appState.spareParts.filter(p => p.replaceBy === 'ASAP');
    if (asapParts.length > 0) {
      reportHTML += '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">';
      asapParts.forEach(p => {
        reportHTML += '<div style="background: linear-gradient(135deg, #fef2f2, #fee2e2); border: 1px solid #fecaca; border-radius: 14px; padding: 16px;">';
        reportHTML += '<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">';
        reportHTML += '<div style="width: 24px; height: 24px; border-radius: 6px; background: #ef4444; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 12px;">&#128308;</span></div>';
        reportHTML += '<span style="font-size: 13px; font-weight: 700; color: #dc2626;">' + p.part + '</span></div>';
        reportHTML += '<div style="display: flex; gap: 6px; margin-bottom: 8px;">';
        reportHTML += '<span style="font-size: 10px; padding: 2px 8px; background: #fecaca; color: #dc2626; border-radius: 20px; font-weight: 600;">ASAP</span>';
        reportHTML += '<span style="font-size: 10px; padding: 2px 8px; background: #fee2e2; color: #991b1b; border-radius: 20px;">Critical</span></div>';
        reportHTML += '<p style="font-size: 11px; color: #7f1d1d;">' + p.machine + ' • ' + p.cost + '</p>';
        reportHTML += '</div>';
      });
      reportHTML += '</div>';
    }
    reportHTML += '</div>';
  }

  // ===== LASER PARAMETER TRACKING =====
  if (sections.laserParams) {
    reportHTML += '<div style="margin-bottom: 32px; page-break-before: always;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
    reportHTML += '<div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #ef4444, #dc2626); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 16px;">&#128202;</span></div>';
    reportHTML += '<h2 style="font-size: 18px; font-weight: 700; color: #0f172a;">Laser Parameter Tracking</h2>';
    reportHTML += '</div>';
    const paramIcons = ['&#9889;', '&#127919;', '&#9679;', '&#128205;', '&#12336;', '&#9675;', '&#128077;'];
    reportHTML += '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">';
    reportState.parameters.forEach((p, idx) => {
      const c = paramColors[p.status] || paramColors['Pass'];
      const icon = paramIcons[idx % paramIcons.length];
      const trendIcon = p.trend === 'up' ? '&#8599;' : p.trend === 'down' ? '&#8600;' : '&#8594;';
      const trendColor = p.trend === 'up' ? '#16a34a' : p.trend === 'down' ? '#dc2626' : '#64748b';
      reportHTML += '<div style="background: linear-gradient(180deg, ' + c.bg + ', white); border: 1px solid ' + c.border + '; border-radius: 14px; padding: 16px; text-align: center; position: relative;">';
      reportHTML += '<div style="width: 40px; height: 40px; border-radius: 12px; background: ' + c.badge + '15; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; border: 2px solid ' + c.badge + '30;">';
      reportHTML += '<span style="font-size: 18px;">' + icon + '</span></div>';
      reportHTML += '<p style="font-size: 11px; color: #64748b; margin-bottom: 6px; font-weight: 600;">' + p.param + '</p>';
      reportHTML += '<div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 8px;">';
      reportHTML += '<span style="font-size: 13px; font-weight: 700; color: #94a3b8;">' + p.before + '</span>';
      reportHTML += '<span style="color: #cbd5e1; font-size: 10px;">&#8594;</span>';
      reportHTML += '<span style="font-size: 16px; font-weight: 800; color: ' + c.text + ';">' + p.after + '</span></div>';
      reportHTML += '<p style="font-size: 10px; color: #94a3b8; margin-bottom: 6px;">Target: ' + p.target + '</p>';
      reportHTML += '<div style="display: flex; align-items: center; justify-content: center; gap: 6px;">';
      reportHTML += '<span style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; background: ' + c.badge + '15; color: ' + c.badge + '; border: 1px solid ' + c.badge + '40;">' + p.status.toUpperCase() + '</span>';
      reportHTML += '<span style="font-size: 12px; color: ' + trendColor + ';">' + trendIcon + '</span></div>';
      reportHTML += '</div>';
    });
    reportHTML += '</div>';
    reportHTML += '<h3 style="font-size: 14px; font-weight: 700; color: #334155; margin: 20px 0 12px;">Per-Parameter Root Cause & Corrective Actions</h3>';
    reportState.parameters.forEach(p => {
      if (p.rootCause && p.rootCause.trim() !== '' && p.rootCause !== 'Within tolerance. No action required.' && p.rootCause !== 'Profile stable. No degradation detected.' && p.rootCause !== 'Continue monitoring.') {
        const c = paramColors[p.status] || paramColors['Pass'];
        reportHTML += '<div style="background: ' + c.bg + '; border: 1px solid ' + c.border + '; border-radius: 12px; padding: 14px 18px; margin-bottom: 8px;">';
        reportHTML += '<p style="font-size: 12px; color: #1e293b; font-weight: 700; margin-bottom: 6px;">' + p.param + '</p>';
        reportHTML += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">';
        reportHTML += '<div><p style="font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px;">Root Cause</p><p style="font-size: 12px; color: #475569; line-height: 1.5;">' + p.rootCause + '</p></div>';
        reportHTML += '<div><p style="font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px;">Action Taken</p><p style="font-size: 12px; color: #475569; line-height: 1.5;">' + p.action + '</p></div>';
        reportHTML += '</div></div>';
      }
    });
    reportHTML += '</div>';
  }

  // ===== ROOT CAUSE ANALYSIS =====
  if (sections.rootCause) {
    reportHTML += '<div style="margin-bottom: 32px;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
    reportHTML += '<div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #a855f7, #7c3aed); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 16px;">&#128269;</span></div>';
    reportHTML += '<h2 style="font-size: 18px; font-weight: 700; color: #0f172a;">Root Cause Analysis</h2>';
    reportHTML += '</div>';
    reportHTML += '<div style="background: linear-gradient(135deg, #fefce8, #fef9c3); border: 1px solid #fde047; border-radius: 16px; padding: 20px; position: relative;">';
    reportHTML += '<div style="position: absolute; top: -10px; left: 20px; background: #f59e0b; color: white; font-size: 10px; font-weight: 700; padding: 3px 12px; border-radius: 20px;">ANALYSIS</div>';
    reportHTML += '<p style="font-size: 13px; color: #78350f; line-height: 1.8; white-space: pre-line; margin-top: 8px;">' + rootCause + '</p>';
    reportHTML += '</div></div>';

    reportHTML += '<div style="margin-bottom: 32px;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
    reportHTML += '<div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #22c55e, #16a34a); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 16px;">&#9989;</span></div>';
    reportHTML += '<h2 style="font-size: 18px; font-weight: 700; color: #0f172a;">Corrective Actions Taken</h2>';
    reportHTML += '</div>';
    reportHTML += '<div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #86efac; border-radius: 16px; padding: 20px; position: relative;">';
    reportHTML += '<div style="position: absolute; top: -10px; left: 20px; background: #22c55e; color: white; font-size: 10px; font-weight: 700; padding: 3px 12px; border-radius: 20px;">ACTIONS</div>';
    reportHTML += '<p style="font-size: 13px; color: #166534; line-height: 1.8; white-space: pre-line; margin-top: 8px;">' + actions + '</p>';
    reportHTML += '</div></div>';

    reportHTML += '<div style="margin-bottom: 32px;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
    reportHTML += '<div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #3b82f6, #2563eb); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 16px;">&#128161;</span></div>';
    reportHTML += '<h2 style="font-size: 18px; font-weight: 700; color: #0f172a;">Recommendations & Preventive Actions</h2>';
    reportHTML += '</div>';
    reportHTML += '<div style="background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1px solid #93c5fd; border-radius: 16px; padding: 20px; position: relative;">';
    reportHTML += '<div style="position: absolute; top: -10px; left: 20px; background: #3b82f6; color: white; font-size: 10px; font-weight: 700; padding: 3px 12px; border-radius: 20px;">NEXT STEPS</div>';
    reportHTML += '<p style="font-size: 13px; color: #1e40af; line-height: 1.8; white-space: pre-line; margin-top: 8px;">' + recommendations + '</p>';
    reportHTML += '</div></div>';
  }

  // ===== PARAMETER VISUALIZATION / CHARTS =====
  if (sections.charts) {
    reportHTML += '<div style="margin-bottom: 32px; page-break-before: always;">';
    reportHTML += '<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">';
    reportHTML += '<div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #a855f7, #7c3aed); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 16px;">&#128200;</span></div>';
    reportHTML += '<h2 style="font-size: 18px; font-weight: 700; color: #0f172a;">Parameter Visualization & Trend Analysis</h2>';
    reportHTML += '</div>';
    reportHTML += '<div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-radius: 16px; padding: 28px; margin-bottom: 20px; text-align: center; border: 1px solid #e2e8f0;">';
    reportHTML += '<p style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em; margin-bottom: 16px;">Machine Health Score</p>';
    reportHTML += '<div style="display: flex; justify-content: center; gap: 4px; margin-bottom: 16px;">';
    for (let i = 0; i < 10; i++) {
      const filled = i < Math.floor(healthScore / 10);
      const barColor = filled ? scoreColor : '#e2e8f0';
      reportHTML += '<div style="width: 32px; height: 10px; background: ' + barColor + '; border-radius: 5px;"></div>';
    }
    reportHTML += '</div>';
    reportHTML += '<p style="font-size: 32px; font-weight: 800; color: ' + scoreColor + '; font-family: monospace;">' + healthScore + '<span style="font-size: 16px;">/100</span></p>';
    reportHTML += '<p style="font-size: 13px; color: #64748b; margin-top: 8px;">' + (healthScore >= 90 ? 'Excellent — Machine in optimal condition' : healthScore >= 70 ? 'Good — Minor issues addressed' : 'Attention Required — Critical issues found') + '</p>';
    reportHTML += '</div>';
    reportHTML += '<h3 style="font-size: 14px; font-weight: 700; color: #334155; margin: 20px 0 12px;">Parameter Performance Summary</h3>';
    reportHTML += '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">';
    reportState.parameters.forEach(p => {
      const change = p.before !== p.after ? (p.trend === 'up' ? '&#8599; Improved' : p.trend === 'down' ? '&#8600; Degraded' : '&#8594; Stable') : '&#8594; No change';
      const changeColor = p.trend === 'up' ? '#16a34a' : p.trend === 'down' ? '#dc2626' : '#64748b';
      const assessment = p.status === 'Pass' ? '&#10003; Within specification' : p.status === 'Fail' ? '&#10007; Out of specification' : '&#9888; Marginal — monitor closely';
      const c = paramColors[p.status] || paramColors['Pass'];
      reportHTML += '<div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; display: flex; align-items: center; gap: 12px;">';
      reportHTML += '<div style="width: 8px; height: 40px; border-radius: 4px; background: ' + c.badge + ';"></div>';
      reportHTML += '<div style="flex: 1;">';
      reportHTML += '<p style="font-size: 12px; font-weight: 700; color: #1e293b;">' + p.param + '</p>';
      reportHTML += '<div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">';
      reportHTML += '<span style="font-size: 11px; color: #94a3b8;">' + p.before + ' &#8594; <strong style="color: ' + c.text + ';">' + p.after + '</strong></span>';
      reportHTML += '<span style="font-size: 11px; color: ' + changeColor + ';">' + change + '</span></div>';
      reportHTML += '<p style="font-size: 10px; color: ' + c.text + '; margin-top: 4px;">' + assessment + '</p></div>';
      reportHTML += '</div>';
    });
    reportHTML += '</div>';
    const improving = reportState.parameters.filter(p => p.trend === 'up').length;
    const declining = reportState.parameters.filter(p => p.trend === 'down').length;
    const stable = reportState.parameters.filter(p => p.trend === 'stable').length;
    reportHTML += '<div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 0 12px 12px 0; padding: 14px 18px;">';
    reportHTML += '<p style="font-size: 12px; color: #1e40af; line-height: 1.7;"><strong>Trend Analysis:</strong> Of ' + reportState.parameters.length + ' parameters tracked: <strong>' + improving + ' improved</strong>, <strong>' + declining + ' declined</strong>, <strong>' + stable + ' remained stable</strong>. Overall machine health is ' + (healthScore >= 80 ? 'trending positive' : healthScore >= 60 ? 'stable with concerns' : 'declining — immediate attention required') + '.</p>';
    reportHTML += '</div></div>';
  }

  // ===== SIGN-OFF =====
  reportHTML += '<div style="margin-top: 50px; border-top: 2px solid #e2e8f0; padding-top: 30px;">';
  reportHTML += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">';
  reportHTML += '<div style="background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0;">';
  reportHTML += '<p style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">FSE Signature</p>';
  reportHTML += '<div style="border-bottom: 1px solid #cbd5e1; height: 40px;"></div>';
  reportHTML += '<p style="font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600;">' + fse + '</p>';
  reportHTML += '<p style="font-size: 10px; color: #94a3b8;">Date: _______________</p></div>';
  reportHTML += '<div style="background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0;">';
  reportHTML += '<p style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Customer Representative Signature</p>';
  reportHTML += '<div style="border-bottom: 1px solid #cbd5e1; height: 40px;"></div>';
  reportHTML += '<p style="font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600;">ST Representative</p>';
  reportHTML += '<p style="font-size: 10px; color: #94a3b8;">Date: _______________</p></div>';
  reportHTML += '</div></div>';

  // Footer
  reportHTML += '<div style="margin-top: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">';
  reportHTML += '<p style="font-size: 11px; color: #94a3b8;">EO Technics FSE — Wafer Laser Via Health Check Contract — Report generated on ' + date + '</p>';
  reportHTML += '<p style="font-size: 11px; color: #94a3b8;">This report is a contractual document. Retain for quality audit purposes. Enhanced Report v2.0</p>';
  reportHTML += '</div>';

  reportHTML += '</div>';

  // Destroy modal charts
  if (radarChart) { radarChart.destroy(); radarChart = null; }
  if (barChart) { barChart.destroy(); barChart = null; }
  if (trendChart) { trendChart.destroy(); trendChart = null; }
  if (cdaChart) { cdaChart.destroy(); cdaChart = null; }
  if (coolingChart) { coolingChart.destroy(); coolingChart = null; }

  closeReportGenerator();

  const container = document.getElementById('reportPreviewContainer');
  container.innerHTML = reportHTML;
  container.style.display = 'block';

  setTimeout(() => {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 150);
}
function printReport() {
  const container = document.getElementById('reportPreviewContainer');
  if (container.innerHTML === '' || container.style.display === 'none') {
    generateReportPreview();
    setTimeout(() => { window.print(); }, 1000);
  } else {
    window.print();
  }
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeCalendar();
    closeLaserParamModal();
    closeSparePartsModal();
    closeReportGenerator();
    closeLaserPowerModal();
    closeLaserProfileModal();
    closeViaImageModal();
    closeBeamProfileModal();
    closeFocusModal();
    closePowerOffsetModal();
    closeChangeLogModal();
  }
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    if (document.getElementById('reportGeneratorModal').classList.contains('active')) {
      saveReportToLocalStorage();
    }
  }
  if (e.ctrlKey && e.key === 'p') {
    e.preventDefault();
    if (document.getElementById('reportGeneratorModal').classList.contains('active')) {
      printReport();
    }
  }
});

// Auto-save every 30 seconds
setInterval(function() {
  if (document.getElementById('reportGeneratorModal').classList.contains('active')) {
    saveReportToLocalStorage();
    const indicator = document.getElementById('autoSaveIndicator');
    if (indicator) {
      indicator.innerHTML = '<span class="w-2 h-2 rounded-full bg-neon-green"></span><span class="text-xs text-neon-green">Saved just now</span>';
      setTimeout(() => {
        indicator.innerHTML = '<span class="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span><span class="text-xs text-slate-500">Auto-save enabled</span>';
      }, 2000);
    }
  }
}, 30000);
// ===================== EDIT PANEL =====================
function toggleEditPanel() {
  const form = document.getElementById('editForm');
  const btn = document.getElementById('editToggleBtn');
  if (form.style.display === 'none') {
    form.style.display = 'grid';
    btn.innerHTML = '<i class="fas fa-chevron-up mr-1"></i> Hide';
  } else {
    form.style.display = 'none';
    btn.innerHTML = '<i class="fas fa-chevron-down mr-1"></i> Show';
  }
}

function updateDashboard() {
  const startVal = document.getElementById('startDateInput').value;
  let totalDays = parseInt(document.getElementById('totalDaysInput').value) || 80;
  let machineCount = parseInt(document.getElementById('machineCountInput').value) || 5;
  const patternStr = document.getElementById('dayPatternInput').value;
  let pattern = patternStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);

  if (!startVal || isNaN(new Date(startVal).getTime())) { console.warn('Invalid start date'); return; }
  totalDays = Math.max(1, Math.min(200, totalDays));
  machineCount = Math.max(1, Math.min(10, machineCount));
  if (pattern.length === 0) { pattern = [3, 2, 3, 2]; document.getElementById('dayPatternInput').value = '3,2,3,2'; }

  appState.startDate = startVal;
  appState.totalDays = totalDays;
  appState.machineCount = machineCount;
  appState.dayPattern = pattern;

  appState.machineSequence = appState.machineSequence.filter(m => m > 0 && m <= machineCount);
  if (appState.machineSequence.length === 0) {
    appState.machineSequence = Array.from({length: machineCount}, (_, i) => i + 1);
  }
  document.getElementById('machineSequenceInput').value = appState.machineSequence.join(',');

  buildSchedule();
  renderAll();
}


// ===================== ACCESSIBILITY UTILITIES =====================

// Export / Import wiring
window.__exportContract = exportContract;
window.__importContract = async function(input) {
  const file = input.files[0];
  if (!file) return;
  try {
    const data = await importContract(file);
    setState(data);
    // Rebuild schedule if needed
    buildSchedule();
    renderAll();
    alert('Contract imported successfully. Images are not included in JSON import — re-upload if needed.');
  } catch (e) {
    alert('Import failed: ' + e.message);
  }
  input.value = '';
};

function renderAll() {
  updateSidebarInfo();
  renderMachineSequence();
  renderKPIs();
  renderMachineCards();
  renderTimeline();
  renderAlerts();
  renderParams();
  renderSpareParts();
  renderQuarterlyBudget();
  renderTerms();
  renderInsights();
  renderLaserPowerMonitor();
  renderLaserProfileMonitor();
  renderViaImageReport();
  renderBeamProfileReport();
  renderFocusOptimization();
  renderLaserDefocus();
  renderPowerOffset();
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', function() {
  try {
    buildSchedule();
    renderAll();
  } catch (err) {
    console.error('Dashboard init error:', err);
  }

  const bars = document.querySelectorAll('[style*="width:"]');
  bars.forEach(bar => {
    const width = bar.style.width;
    if (width && width !== '0%') {
      bar.style.width = '0%';
      setTimeout(() => { bar.style.width = width; }, 300);
    }
  });
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeCalendar();
    closeLaserParamModal();
    closeSparePartsModal();
    closeReportGenerator();
    closeLaserPowerModal();
    closeLaserProfileModal();
    closeViaImageModal();
    closeBeamProfileModal();
    closeChangeLogModal();
  }
});


// ===================== SIDEBAR NAVIGATION =====================
// Update active sidebar item on scroll
let scrollTimeout;
window.addEventListener('scroll', function() {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(function() {
    const sections = ['dashboardTop', 'executiveSummary', 'fleetStatus', 'laserParams', 'laserPower', 'laserProfile', 'viaImages', 'beamProfile', 'focusOptimization', 'powerOffset', 'spareParts', 'budgetQuarterly', 'buyoffReport', 'contractTerms', 'fseInsights', 'satisfaction'];
    let current = '';
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = document.getElementById(sections[i]);
      if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100) {
          current = sections[i];
          break;
        }
      }
    }
    if (current) {
      document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
      });
      const btn = document.querySelector('.sidebar-item[data-section="' + current + '"]');
      if (btn) btn.classList.add('active');
    }
  }, 100);
});

// Update sidebar contract info
function updateSidebarInfo() {
  const info = document.getElementById('sidebarContractInfo');
  if (info) {
    info.textContent = document.getElementById('headerPeriod')?.textContent || 'WK30 2026 → WK30 2028';
  }
}


// ===================== INIT =====================
function init() {
  try {
    buildSchedule();
    renderAll();
    updateUVLaserDisplay();
    updateCDAGraph();
    updateCoolingDisplay();
    updateCharts();
  } catch (e) {
    console.error('Dashboard init error:', e);
  }
}
init();

// Wire change log modal globally
window.openChangeLogModal = openChangeLogModal;
window.closeChangeLogModal = closeChangeLogModal;

// ===================== KEYBOARD SHORTCUTS =====================
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const openModal = document.querySelector('.modal-overlay.active');
    if (openModal) {
      const closeBtn = openModal.querySelector('.close-btn');
      if (closeBtn) closeBtn.click();
    }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    const reportModal = document.getElementById('reportGeneratorModal');
    if (reportModal && reportModal.classList.contains('active')) {
      saveReportToLocalStorage();
    }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  }
});

