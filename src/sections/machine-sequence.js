// Auto-generated section module — a4.6 refactor
import { appState } from '../state/store.js';
import { triggerRenderAll } from '../core/lifecycle.js';
import { openModalA11y, closeModalA11y } from '../ui/modal-system.js';
import { addChangeLogEntry } from '../ui/change-log-modal.js';
import { uploadAndStoreImage } from '../state/persist.js';
import { parseDate, addDays, formatWeek, formatDate } from '../core/dates.js';
import { calculateContractHealth, calculateFleetHealth, getNextMilestone } from '../core/health.js';
import { buildSchedule } from '../core/schedule.js';

// ===================== MACHINE SEQUENCE =====================
function renderMachineSequence() {
  const container = document.getElementById('machineSequenceDisplay');
  if (!container) return;
  const seq = appState.machineSequence;
  let html = '';
  seq.forEach((m, i) => {
    const colors = ['bg-neon-blue/20 text-neon-blue', 'bg-neon-purple/20 text-neon-purple', 'bg-neon-green/20 text-neon-green', 'bg-neon-amber/20 text-neon-amber', 'bg-neon-red/20 text-neon-red'];
    const colorClass = colors[i % colors.length];
    html += '<div class="machine-seq-badge ' + colorClass + ' border border-white/10">' + m + '</div>';
    if (i < seq.length - 1) html += '<i class="fas fa-arrow-right text-slate-600 text-xs"></i>';
  });
  container.innerHTML = html;
}

function updateMachineSequence() {
  const input = document.getElementById('machineSequenceInput').value;
  let seq = input.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0 && n <= appState.machineCount);
  seq = [...new Set(seq)];
  if (seq.length > 0) {
    appState.machineSequence = seq;
    buildSchedule();
    triggerRenderAll();
  } else {
    appState.machineSequence = Array.from({length: appState.machineCount}, (_, i) => i + 1);
    document.getElementById('machineSequenceInput').value = appState.machineSequence.join(',');
    buildSchedule();
    triggerRenderAll();
  }
}

