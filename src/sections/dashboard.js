// src/sections/dashboard.js
// KPIs, timeline, alerts, executive summary

import { appState } from '../../state/store.js';
import { parseDate, addDays, formatWeek } from '../../core/dates.js';
import { calculateContractHealth, calculateFleetHealth, getNextMilestone } from '../../core/health.js';

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
