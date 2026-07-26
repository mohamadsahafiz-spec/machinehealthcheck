// src/sections/laser/power.js
// Laser power monitor + edit modal

import { appState } from '../../state/store.js';
import { openModalA11y, closeModalA11y } from '../../ui/modal-system.js';

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
  closeLaserPowerModal();
}
