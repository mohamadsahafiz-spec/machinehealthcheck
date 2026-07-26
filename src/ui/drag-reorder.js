// src/ui/drag-reorder.js
import { getState, setState } from '../state/store.js';

/**
 * Initialize HTML5 Drag-and-Drop on machine sequence badges.
 * Uses a MutationObserver so re-renders from app.js auto-rebind.
 */
export function initMachineSequenceDnD() {
  const container = document.getElementById('machineSequenceDisplay');
  if (!container) return;

  function setupBadges() {
    const badges = container.querySelectorAll('[data-machine-num]');
    badges.forEach(badge => {
      if (badge._dndReady) return;
      badge._dndReady = true;
      badge.draggable = true;

      badge.addEventListener('dragstart', (e) => {
        const num = badge.dataset.machineNum;
        e.dataTransfer.setData('text/plain', num);
        e.dataTransfer.effectAllowed = 'move';
        badge.classList.add('dragging');
      });

      badge.addEventListener('dragend', () => {
        badge.classList.remove('dragging');
        badges.forEach(b => b.classList.remove('drag-over'));
      });

      badge.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      badge.addEventListener('dragenter', (e) => {
        e.preventDefault();
        badge.classList.add('drag-over');
      });

      badge.addEventListener('dragleave', () => {
        badge.classList.remove('drag-over');
      });

      badge.addEventListener('drop', (e) => {
        e.preventDefault();
        const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
        const to = parseInt(badge.dataset.machineNum, 10);
        if (isNaN(from) || isNaN(to) || from === to) return;
        reorderMachines(from, to);
      });
    });
  }

  // Watch for DOM changes (re-renders) and re-bind
  const observer = new MutationObserver(setupBadges);
  observer.observe(container, { childList: true });
  requestAnimationFrame(setupBadges);
}

function reorderMachines(from, to) {
  const state = getState();
  const seq = [...(state.machineSequence || [])];
  const fromIdx = seq.indexOf(from);
  const toIdx = seq.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return;

  seq.splice(fromIdx, 1);
  seq.splice(toIdx, 0, from);

  setState({ machineSequence: seq });

  const input = document.getElementById('machineSequenceInput');
  if (input) input.value = seq.join(',');

  // Trigger re-render if app exposes a global render hook
  if (typeof window.__renderFromState === 'function') {
    window.__renderFromState();
  } else if (typeof window.updateMachineSequence === 'function') {
    window.updateMachineSequence();
  } else if (typeof window.updateDashboard === 'function') {
    window.updateDashboard();
  }
}
