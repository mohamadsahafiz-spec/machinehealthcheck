// Auto-generated section module — a4.6 refactor
import { appState } from '../state/store.js';
import { triggerRenderAll } from '../core/lifecycle.js';
import { openModalA11y, closeModalA11y } from '../ui/modal-system.js';
import { addChangeLogEntry } from '../ui/change-log-modal.js';
import { uploadAndStoreImage } from '../state/persist.js';
import { parseDate, addDays, formatWeek, formatDate } from '../core/dates.js';
import { calculateContractHealth, calculateFleetHealth, getNextMilestone } from '../core/health.js';
import { buildSchedule } from '../core/schedule.js';

// ===================== ACCESSIBILITY UTILITIES =====================

// Export / Import wiring
window.__exportContract = exportContract;
window.__importContract = async function(input) {
  const file = input.files[0];
  if (!file) return;
  try {
    const data = await importContract(file);
    setState(data);
    // Rebuild schedule if needed
    buildSchedule();
    triggerRenderAll();
    alert('Contract imported successfully. Images are not included in JSON import — re-upload if needed.');
  } catch (e) {
    alert('Import failed: ' + e.message);
  }
  input.value = '';
};


