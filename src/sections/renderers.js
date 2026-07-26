// Auto-generated section module — a4.6 refactor
import { appState } from '../state/store.js';
import { triggerRenderAll } from '../core/lifecycle.js';
import { openModalA11y, closeModalA11y } from '../ui/modal-system.js';
import { addChangeLogEntry } from '../ui/change-log-modal.js';
import { uploadAndStoreImage } from '../state/persist.js';
import { parseDate, addDays, formatWeek, formatDate } from '../core/dates.js';
import { calculateContractHealth, calculateFleetHealth, getNextMilestone } from '../core/health.js';
import { buildSchedule } from '../core/schedule.js';

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

