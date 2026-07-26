// src/sections/reports/generator.js
// Report generator modal (UV, CDA, cooling, parameters, charts)

import { appState } from '../../state/store.js';
import { uploadAndStoreImage } from '../../state/persist.js';
import { openModalA11y, closeModalA11y } from '../../ui/modal-system.js';

export let reportState = {
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

export const UV_LASER_MAX_HOURS = 25000;
export const UV_LASER_WARNING = 20000;

let radarChart, barChart, trendChart, cdaChart, coolingChart;

export function destroyReportCharts() {
  if (radarChart) { radarChart.destroy(); radarChart = null; }
  if (barChart) { barChart.destroy(); barChart = null; }
  if (trendChart) { trendChart.destroy(); trendChart = null; }
  if (cdaChart) { cdaChart.destroy(); cdaChart = null; }
  if (coolingChart) { coolingChart.destroy(); coolingChart = null; }
}

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

function updateHealthScoreDisplay() {
  const score = document.getElementById('healthScore').value;
  document.getElementById('healthScoreDisplay').textContent = score;
  const display = document.getElementById('healthScoreDisplay');
  if (score >= 90) display.className = 'text-2xl font-bold font-mono text-neon-green';
  else if (score >= 70) display.className = 'text-2xl font-bold font-mono text-neon-amber';
  else display.className = 'text-2xl font-bold font-mono text-neon-red';
}

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
  destroyReportCharts();
  closeModalA11y('reportGeneratorModal');
}

function updateMachinePreview() {}

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
