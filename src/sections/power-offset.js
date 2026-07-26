// Auto-generated section module — a4.6 refactor
import { appState } from '../state/store.js';
import { triggerRenderAll } from '../core/lifecycle.js';
import { openModalA11y, closeModalA11y } from '../ui/modal-system.js';
import { addChangeLogEntry } from '../ui/change-log-modal.js';
import { uploadAndStoreImage } from '../state/persist.js';
import { parseDate, addDays, formatWeek, formatDate } from '../core/dates.js';
import { calculateContractHealth, calculateFleetHealth, getNextMilestone } from '../core/health.js';
import { buildSchedule } from '../core/schedule.js';

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

