// src/sections/laser/params.js
// Laser parameter grid + edit modal

import { appState } from '../../state/store.js';
import { openModalA11y, closeModalA11y } from '../../ui/modal-system.js';

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
  closeLaserParamModal();
}
