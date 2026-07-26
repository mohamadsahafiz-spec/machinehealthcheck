// src/sections/operations/spare-parts.js
// Spare parts list + edit modal

import { appState } from '../../state/store.js';
import { openModalA11y, closeModalA11y } from '../../ui/modal-system.js';

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

function openSparePartsModal() {
  renderSparePartsEditList();
  openModalA11y('sparePartsModal');
}

function closeSparePartsModal() { closeModalA11y('sparePartsModal'); }

function renderSparePartsEditList() {
  const container = document.getElementById('sparePartsEditList');
  let html = '';
  appState.spareParts.forEach((sp, idx) => {
    html += '<div class="spare-edit-row">';
    html += '<input type="text" class="spare-edit-input" value="' + sp.part + '" id="sp-part-' + idx + '" placeholder="Part name">';
    html += '<input type="text" class="spare-edit-input" value="' + sp.machine + '" id="sp-machine-' + idx + '" placeholder="Machine">';
    html += '<input type="text" class="spare-edit-input" value="' + sp.cost + '" id="sp-cost-' + idx + '" placeholder="Cost">';
    html += '<select class="spare-edit-select" id="sp-replace-' + idx + '">';
    html += '<option value="ASAP" ' + (sp.replaceBy === 'ASAP' ? 'selected' : '') + '>ASAP</option>';
    html += '<option value="Next quarter" ' + (sp.replaceBy === 'Next quarter' ? 'selected' : '') + '>Next quarter</option>';
    html += '<option value="N/A" ' + (sp.replaceBy === 'N/A' ? 'selected' : '') + '>N/A</option>';
    html += '</select>';
    html += '<select class="spare-edit-select" id="sp-status-' + idx + '">';
    html += '<option value="Monitor" ' + (sp.status === 'Monitor' ? 'selected' : '') + '>Monitor</option>';
    html += '<option value="Plan Order" ' + (sp.status === 'Plan Order' ? 'selected' : '') + '>Plan Order</option>';
    html += '<option value="OK" ' + (sp.status === 'OK' ? 'selected' : '') + '>OK</option>';
    html += '<option value="Critical" ' + (sp.status === 'Critical' ? 'selected' : '') + '>Critical</option>';
    html += '</select>';
    html += '<button onclick="removeSparePart(' + idx + ')" class="btn-sm btn-danger"><i class="fas fa-trash"></i></button>';
    html += '</div>';
  });
  container.innerHTML = html;
}

function addSparePart() {
  const newId = appState.spareParts.length > 0 ? Math.max(...appState.spareParts.map(p => p.id)) + 1 : 1;
  appState.spareParts.push({
    id: newId,
    part: 'New Part',
    machine: 'WLVIA #1',
    cost: '$0',
    replaceBy: 'Next quarter',
    status: 'Monitor',
    statusClass: 'bg-neon-green/10 text-neon-green border-neon-green/20'
  });
  renderSparePartsEditList();
}

function removeSparePart(idx) {
  appState.spareParts.splice(idx, 1);
  renderSparePartsEditList();
}

function saveSpareParts() {
  const newParts = [];
  appState.spareParts.forEach((sp, idx) => {
    const part = document.getElementById('sp-part-' + idx)?.value || sp.part;
    const machine = document.getElementById('sp-machine-' + idx)?.value || sp.machine;
    const cost = document.getElementById('sp-cost-' + idx)?.value || sp.cost;
    const replaceBy = document.getElementById('sp-replace-' + idx)?.value || sp.replaceBy;
    const status = document.getElementById('sp-status-' + idx)?.value || sp.status;

    let statusClass = 'bg-slate-700/50 text-slate-400 border-slate-600';
    if (status === 'Monitor') statusClass = 'bg-neon-green/10 text-neon-green border-neon-green/20';
    else if (status === 'Plan Order') statusClass = 'bg-neon-amber/10 text-neon-amber border-neon-amber/20';
    else if (status === 'OK') statusClass = 'bg-neon-blue/10 text-neon-blue border-neon-blue/20';
    else if (status === 'Critical') statusClass = 'bg-neon-red/10 text-neon-red border-neon-red/20';

    newParts.push({ ...sp, part, machine, cost, replaceBy, status, statusClass });
  });
  appState.spareParts = newParts;
  renderSpareParts();
  renderAlerts();
  closeSparePartsModal();
}
