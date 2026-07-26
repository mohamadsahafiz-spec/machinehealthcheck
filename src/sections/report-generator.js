// Auto-generated section module — a4.6 refactor
import { appState } from '../state/store.js';
import { triggerRenderAll } from '../core/lifecycle.js';
import { openModalA11y, closeModalA11y } from '../ui/modal-system.js';
import { addChangeLogEntry } from '../ui/change-log-modal.js';
import { uploadAndStoreImage } from '../state/persist.js';
import { parseDate, addDays, formatWeek, formatDate } from '../core/dates.js';
import { calculateContractHealth, calculateFleetHealth, getNextMilestone } from '../core/health.js';
import { buildSchedule } from '../core/schedule.js';

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
let radarChart, barChart, trendChart, cdaChart, coolingChart;

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
