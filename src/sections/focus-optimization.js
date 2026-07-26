// Auto-generated section module — a4.6 refactor
import { appState } from '../state/store.js';
import { triggerRenderAll } from '../core/lifecycle.js';
import { openModalA11y, closeModalA11y } from '../ui/modal-system.js';
import { addChangeLogEntry } from '../ui/change-log-modal.js';
import { uploadAndStoreImage } from '../state/persist.js';
import { parseDate, addDays, formatWeek, formatDate } from '../core/dates.js';
import { calculateContractHealth, calculateFleetHealth, getNextMilestone } from '../core/health.js';
import { buildSchedule } from '../core/schedule.js';

// ===================== FOCUS OPTIMIZATION RENDERERS =====================
export function renderFocusOptimization() {
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

export function renderLaserDefocus() {
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

export function openFocusModal() {
  renderFocusEdit();
  openModalA11y('focusModal');
}
export function closeFocusModal() { closeModalA11y('focusModal'); }
export function renderFocusEdit() {
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
export function addFocusMeasurement() {
  const newId = appState.focusOptimization.measurements.length > 0 ? Math.max(...appState.focusOptimization.measurements.map(m => m.id)) + 1 : 1;
  appState.focusOptimization.measurements.push({ id: newId, title: 'New Measurement', value: '-', tolerance: '-', status: 'Pass', image: '', note: '' });
  renderFocusEdit();
}
export function removeFocusMeasurement(idx) {
  appState.focusOptimization.measurements.splice(idx, 1);
  renderFocusEdit();
}
export function addDefocusItem() {
  const items = appState.focusOptimization.laserDefocus.items;
  const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
  items.push({ id: newId, defocus: '0 μm', viaSize: '-', roundness: '-', quality: 'Good', image: '', desc: '' });
  renderFocusEdit();
}
export function removeDefocusItem(idx) {
  appState.focusOptimization.laserDefocus.items.splice(idx, 1);
  renderFocusEdit();
}
export function saveFocusData() {
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

