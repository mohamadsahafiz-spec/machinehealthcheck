// src/sections/laser/beam-profile.js
// Beam profile report + edit modal

import { appState } from '../../state/store.js';
import { formatDate } from '../../core/dates.js';
import { uploadAndStoreImage } from '../../state/persist.js';
import { openModalA11y, closeModalA11y } from '../../ui/modal-system.js';

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
