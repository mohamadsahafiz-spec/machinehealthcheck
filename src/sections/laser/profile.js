// src/sections/laser/profile.js
// Laser profile monitor + edit modal

import { appState } from '../../state/store.js';
import { openModalA11y, closeModalA11y } from '../../ui/modal-system.js';

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
  closeLaserProfileModal();
}
