// Auto-generated section module — a4.6 refactor
import { appState } from '../state/store.js';
import { triggerRenderAll } from '../core/lifecycle.js';
import { openModalA11y, closeModalA11y } from '../ui/modal-system.js';
import { addChangeLogEntry } from '../ui/change-log-modal.js';
import { uploadAndStoreImage } from '../state/persist.js';
import { parseDate, addDays, formatWeek, formatDate } from '../core/dates.js';
import { calculateContractHealth, calculateFleetHealth, getNextMilestone } from '../core/health.js';
import { buildSchedule } from '../core/schedule.js';

// ===================== EDIT PANEL =====================
function toggleEditPanel() {
  const form = document.getElementById('editForm');
  const btn = document.getElementById('editToggleBtn');
  if (form.style.display === 'none') {
    form.style.display = 'grid';
    btn.innerHTML = '<i class="fas fa-chevron-up mr-1"></i> Hide';
  } else {
    form.style.display = 'none';
    btn.innerHTML = '<i class="fas fa-chevron-down mr-1"></i> Show';
  }
}

function updateDashboard() {
  const startVal = document.getElementById('startDateInput').value;
  let totalDays = parseInt(document.getElementById('totalDaysInput').value) || 80;
  let machineCount = parseInt(document.getElementById('machineCountInput').value) || 5;
  const patternStr = document.getElementById('dayPatternInput').value;
  let pattern = patternStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);

  if (!startVal || isNaN(new Date(startVal).getTime())) { console.warn('Invalid start date'); return; }
  totalDays = Math.max(1, Math.min(200, totalDays));
  machineCount = Math.max(1, Math.min(10, machineCount));
  if (pattern.length === 0) { pattern = [3, 2, 3, 2]; document.getElementById('dayPatternInput').value = '3,2,3,2'; }

  appState.startDate = startVal;
  appState.totalDays = totalDays;
  appState.machineCount = machineCount;
  appState.dayPattern = pattern;

  appState.machineSequence = appState.machineSequence.filter(m => m > 0 && m <= machineCount);
  if (appState.machineSequence.length === 0) {
    appState.machineSequence = Array.from({length: machineCount}, (_, i) => i + 1);
  }
  document.getElementById('machineSequenceInput').value = appState.machineSequence.join(',');

  buildSchedule();
  triggerRenderAll();
}


