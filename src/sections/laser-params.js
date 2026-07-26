// Auto-generated section module — a4.6 refactor
import { appState } from '../state/store.js';
import { triggerRenderAll } from '../core/lifecycle.js';
import { openModalA11y, closeModalA11y } from '../ui/modal-system.js';
import { addChangeLogEntry } from '../ui/change-log-modal.js';
import { uploadAndStoreImage } from '../state/persist.js';
import { parseDate, addDays, formatWeek, formatDate } from '../core/dates.js';
import { calculateContractHealth, calculateFleetHealth, getNextMilestone } from '../core/health.js';
import { buildSchedule } from '../core/schedule.js';
import { renderParams } from './renderers.js';

// ===================== LASER PARAM EDIT MODAL =====================
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
  addChangeLogEntry({ action: 'update', machine: 'WLVIA #1', field: 'Laser Parameters', before: 'Edited', after: 'Saved (' + newParams.length + ' params)' });
  closeLaserParamModal();
}

