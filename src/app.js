// src/app.js
// a4.6 — Integration & Final Wiring
// All section modules are imported from src/sections/*.js
// No orphaned global references — everything flows through ES-module imports.

// ===================== CORE IMPORTS =====================
import { appState, getState, setState } from './state/store.js';
import { buildSchedule } from './core/schedule.js';
import { registerRenderAll } from './core/lifecycle.js';
import { openModalA11y, closeModalA11y } from './ui/modal-system.js';
import { scrollToSection, toggleMobileSidebar } from './ui/sidebar.js';
import { createChart, destroyChart, destroyAllCharts } from './ui/charts.js';
import { openChangeLogModal, closeChangeLogModal } from './ui/change-log-modal.js';

// ===================== SECTION IMPORTS =====================
import * as MachineSequence from './sections/machine-sequence.js';
import * as Renderers from './sections/renderers.js';
import * as Calendar from './sections/calendar.js';
import * as LaserParams from './sections/laser-params.js';
import * as SpareParts from './sections/spare-parts.js';
import * as LaserPower from './sections/laser-power.js';
import * as LaserProfile from './sections/laser-profile.js';
import * as ViaImages from './sections/via-images.js';
import * as BeamProfile from './sections/beam-profile.js';
import * as FocusOptimization from './sections/focus-optimization.js';
import * as PowerOffset from './sections/power-offset.js';
import * as ReportGenerator from './sections/report-generator.js';
import * as EditPanel from './sections/edit-panel.js';
import * as Accessibility from './sections/accessibility.js';

// ===================== WINDOW WIRING =====================
// Expose all section exports to window so HTML onclick handlers work
// without orphaned global *definitions* — every function lives in its module.
Object.assign(window, MachineSequence);
Object.assign(window, Renderers);
Object.assign(window, Calendar);
Object.assign(window, LaserParams);
Object.assign(window, SpareParts);
Object.assign(window, LaserPower);
Object.assign(window, LaserProfile);
Object.assign(window, ViaImages);
Object.assign(window, BeamProfile);
Object.assign(window, FocusOptimization);
Object.assign(window, PowerOffset);
Object.assign(window, ReportGenerator);
Object.assign(window, EditPanel);
Object.assign(window, Accessibility);

// Wire change-log modal globally (expected by legacy HTML)
window.openChangeLogModal = openChangeLogModal;
window.closeChangeLogModal = closeChangeLogModal;

// ===================== RENDER ORCHESTRATOR =====================
function renderAll() {
  updateSidebarInfo();
  MachineSequence.renderMachineSequence();
  Renderers.renderKPIs();
  Renderers.renderMachineCards();
  Renderers.renderTimeline();
  Renderers.renderAlerts();
  Renderers.renderParams();
  Renderers.renderSpareParts();
  Renderers.renderQuarterlyBudget();
  Renderers.renderTerms();
  Renderers.renderInsights();
  LaserPower.renderLaserPowerMonitor();
  LaserProfile.renderLaserProfileMonitor();
  ViaImages.renderViaImageReport();
  BeamProfile.renderBeamProfileReport();
  FocusOptimization.renderFocusOptimization();
  FocusOptimization.renderLaserDefocus();
  PowerOffset.renderPowerOffset();
}

// Register so section modules can trigger a global refresh via triggerRenderAll()
registerRenderAll(renderAll);

// ===================== SIDEBAR =====================
function updateSidebarInfo() {
  const info = document.getElementById('sidebarContractInfo');
  if (info) {
    info.textContent = document.getElementById('headerPeriod')?.textContent || 'WK30 2026 → WK30 2028';
  }
}

// ===================== EVENT LISTENERS =====================
// Scroll spy for sidebar active state
let scrollTimeout;
window.addEventListener('scroll', function() {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(function() {
    const sections = [
      'dashboardTop', 'executiveSummary', 'fleetStatus', 'laserParams',
      'laserPower', 'laserProfile', 'viaImages', 'beamProfile',
      'focusOptimization', 'powerOffset', 'spareParts', 'budgetQuarterly',
      'buyoffReport', 'contractTerms', 'fseInsights', 'satisfaction'
    ];
    let current = '';
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = document.getElementById(sections[i]);
      if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100) {
          current = sections[i];
          break;
        }
      }
    }
    if (current) {
      document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
      });
      const btn = document.querySelector('.sidebar-item[data-section="' + current + '"]');
      if (btn) btn.classList.add('active');
    }
  }, 100);
});

// Report-section checkbox counter
document.addEventListener('change', function(e) {
  if (e.target.classList.contains('report-section-toggle')) {
    ReportGenerator.updateSectionCount();
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    Calendar.closeCalendar();
    LaserParams.closeLaserParamModal();
    SpareParts.closeSparePartsModal();
    ReportGenerator.closeReportGenerator();
    LaserPower.closeLaserPowerModal();
    LaserProfile.closeLaserProfileModal();
    ViaImages.closeViaImageModal();
    BeamProfile.closeBeamProfileModal();
    FocusOptimization.closeFocusModal();
    PowerOffset.closePowerOffsetModal();
    closeChangeLogModal();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    const reportModal = document.getElementById('reportGeneratorModal');
    if (reportModal && reportModal.classList.contains('active')) {
      ReportGenerator.saveReportToLocalStorage();
    }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault();
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  }
});

// ===================== INIT =====================
function init() {
  try {
    buildSchedule();
    renderAll();
    ReportGenerator.updateUVLaserDisplay();
    ReportGenerator.updateCDAGraph();
    ReportGenerator.updateCoolingDisplay();
    ReportGenerator.updateCharts();
  } catch (err) {
    console.error('Dashboard init error:', err);
  }

  // Animate progress bars on load
  const bars = document.querySelectorAll('[style*="width:"]');
  bars.forEach(bar => {
    const width = bar.style.width;
    if (width && width !== '0%') {
      bar.style.width = '0%';
      setTimeout(() => { bar.style.width = width; }, 300);
    }
  });
}

// Auto-save report generator every 30 seconds
setInterval(function() {
  const reportModal = document.getElementById('reportGeneratorModal');
  if (reportModal && reportModal.classList.contains('active')) {
    ReportGenerator.saveReportToLocalStorage();
    const indicator = document.getElementById('autoSaveIndicator');
    if (indicator) {
      indicator.innerHTML = '<span class="w-2 h-2 rounded-full bg-neon-green"></span><span class="text-xs text-neon-green">Saved just now</span>';
      setTimeout(() => {
        indicator.innerHTML = '<span class="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span><span class="text-xs text-slate-500">Auto-save enabled</span>';
      }, 2000);
    }
  }
}, 30000);

// Start the app
init();
