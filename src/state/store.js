// src/state/store.js
// Reactive state store with subscribe/notify pattern + Zod validation + Audit trail

import { validateState } from './schema.js';
import { auditStateChanges } from './audit.js';

let state = {
  startDate: '2026-07-20',
  totalDays: 80,
  machineCount: 5,
  dayPattern: [3, 2, 3, 2],
  contractYears: 2,
  machineSequence: [3, 1, 2, 4, 5],
  visits: [],
  spareParts: [
    { id: 1, part: 'Laser Lens', machine: 'WLVIA #1', cost: '$1,200', replaceBy: 'Next quarter', status: 'Monitor', statusClass: 'bg-neon-green/10 text-neon-green border-neon-green/20' },
    { id: 2, part: 'Scanner Mirror', machine: 'WLVIA #2', cost: '$850', replaceBy: 'ASAP', status: 'Plan Order', statusClass: 'bg-neon-amber/10 text-neon-amber border-neon-amber/20' },
    { id: 3, part: 'AGC Optics', machine: 'WLVIA #3', cost: '$2,100', replaceBy: 'Next quarter', status: 'Monitor', statusClass: 'bg-neon-green/10 text-neon-green border-neon-green/20' },
    { id: 4, part: 'Power Meter Kit', machine: 'All', cost: '$500', replaceBy: 'N/A', status: 'OK', statusClass: 'bg-neon-blue/10 text-neon-blue border-neon-blue/20' },
  ],
  laserParams: [
    { id: 1, param: 'Laser Source 1 — Max Power', before: '14.5W', after: '14.2W', target: '14.0-15.0W', specRange: '14.0-15.0W', measureAt: 'Laser output coupler', beforeDate: '2026-04-15', afterDate: '2026-07-27', status: 'Fail', icon: 'fa-bolt', color: 'text-neon-red' },
    { id: 2, param: 'Laser Source 2 — Max Power', before: '14.8W', after: '14.6W', target: '14.0-15.0W', specRange: '14.0-15.0W', measureAt: 'Laser output coupler', beforeDate: '2026-04-15', afterDate: '2026-07-27', status: 'Pass', icon: 'fa-bolt', color: 'text-neon-blue' },
    { id: 3, param: 'Laser Accuracy', before: '±3μm', after: '±1.5μm', target: '±2μm', specRange: '±1.5-2.0μm', measureAt: 'AGC scanner stage', beforeDate: '2026-04-15', afterDate: '2026-07-27', status: 'Pass', icon: 'fa-crosshairs', color: 'text-neon-purple' },
    { id: 4, param: 'Via Size', before: '45μm', after: '42μm', target: '40-45μm', specRange: '40-45μm', measureAt: 'Wafer surface (top-down)', beforeDate: '2026-04-15', afterDate: '2026-07-27', status: 'Pass', icon: 'fa-circle', color: 'text-neon-amber' },
    { id: 5, param: 'Via Offset', before: '±2μm', after: '±0.5μm', target: '±1μm', specRange: '±0.5-1.0μm', measureAt: 'Wafer surface (top-down)', beforeDate: '2026-04-15', afterDate: '2026-07-27', status: 'Pass', icon: 'fa-map-marker-alt', color: 'text-neon-red' },
    { id: 6, param: 'Laser Profile', before: 'Gaussian', after: 'Gaussian', target: 'Gaussian', specRange: 'Gaussian (M²<1.3)', measureAt: 'Beam profiler @ focal plane', beforeDate: '2026-04-15', afterDate: '2026-07-27', status: 'Pass', icon: 'fa-wave-square', color: 'text-neon-blue' },
    { id: 7, param: 'Via Shape', before: 'Oval', after: 'Circular', target: 'Circular', specRange: 'Circularity >0.90', measureAt: 'Wafer surface (top-down)', beforeDate: '2026-04-15', afterDate: '2026-07-27', status: 'Pass', icon: 'fa-shapes', color: 'text-neon-purple' },
    { id: 8, param: 'Pad Quality', before: 'Good', after: 'Excellent', target: 'Good+', specRange: 'No burn / no residue', measureAt: 'Wafer surface (top-down)', beforeDate: '2026-04-15', afterDate: '2026-07-27', status: 'Pass', icon: 'fa-thumbs-up', color: 'text-neon-amber' },
  ],
  terms: [
    { num: '1', title: 'Laser Calibration', desc: 'Perform laser calibration with power meter & laser profile check kits' },
    { num: '2', title: 'Reports', desc: 'Supply calibration report & buyoff report after each installation' },
    { num: '3', title: 'Quality Monitoring', desc: 'Monitor laser quality; investigate issues with before/after parameter reports' },
    { num: '4', title: 'Spare Parts', desc: 'Consumables under ST cost. Vendor reports needs; ST buys for next quarter' },
    { num: '5', title: 'Support', desc: 'FSE provides troubleshooting support for laser performance & output quality' },
    { num: '6', title: 'Schedule', desc: 'Quarterly health checks (5 machines/year). 3-day → 2-day alternating pattern' },
  ],
  insights: [
    { icon: 'fa-chart-line', color: 'text-neon-blue', title: 'Day Budget Burn Rate', text: 'Track 80-day contract limit closely. Current burn: 4 days in 2 weeks. If this continues, you will exceed budget by Q4 2026. <strong class="text-neon-blue">Action:</strong> Ensure each 3-day visit is strictly necessary; optimize 2-day visits for routine checks.' },
    { icon: 'fa-file-medical-alt', color: 'text-neon-purple', title: 'Before/After Parameter Delta', text: 'Contract requires root cause reports with before/after data for all 7 laser parameters. <strong class="text-neon-purple">Action:</strong> Log every parameter at service start and end. Flag any parameter that worsens — this triggers mandatory investigation.' },
    { icon: 'fa-exclamation-triangle', color: 'text-neon-amber', title: 'Spare Parts Lead Time', text: 'ST must buy parts for the <em>next quarter</em>. You need to flag needs 6 weeks before quarter end. Scanner Mirror (M2) is flagged "ASAP" — act immediately.' },
    { icon: 'fa-clipboard-check', color: 'text-neon-green', title: 'Report Compliance', text: '2 reports per visit (calibration + buyoff) = 64 total. Currently 3/64 submitted. <strong class="text-neon-green">Action:</strong> Set a 48-hour post-visit SLA for report delivery. WLVIA #1 reports are still pending.' },
    { icon: 'fa-bug', color: 'text-neon-red', title: 'Quality Issue Escalation', text: 'Any ST feedback on laser performance requires immediate troubleshooting. <strong class="text-neon-red">Action:</strong> Maintain a 24-hour response SLA. Document root cause, actions, and parameter changes.' },
    { icon: 'fa-ban', color: 'text-slate-400', title: 'Scope Exclusion', text: 'Manual machine <strong class="text-white">BMD250WM</strong> is NOT covered by this contract. <strong class="text-slate-300">Action:</strong> If ST requests BMD250WM service, flag as out-of-scope and request a separate work order immediately.' },
  ],
  laserPowerMonitor: {
    laser1: {
      name: 'UV Laser Source 1',
      serial: 'UV-2024-001-A',
      wavelength: '355nm',
      masks: [
        { idx: 1, aperture: '20μm', beforePower: 14.5, afterPower: 14.2, specMin: 14.0, specMax: 15.0, status: 'Fail', unit: 'W' },
        { idx: 2, aperture: '25μm', beforePower: 14.3, afterPower: 14.4, specMin: 14.0, specMax: 15.0, status: 'Pass', unit: 'W' },
        { idx: 3, aperture: '30μm', beforePower: 14.1, afterPower: 14.3, specMin: 14.0, specMax: 15.0, status: 'Pass', unit: 'W' },
        { idx: 4, aperture: '35μm', beforePower: 13.9, afterPower: 14.1, specMin: 13.5, specMax: 15.0, status: 'Pass', unit: 'W' },
        { idx: 5, aperture: '40μm', beforePower: 13.7, afterPower: 13.9, specMin: 13.5, specMax: 15.0, status: 'Pass', unit: 'W' },
        { idx: 6, aperture: '45μm', beforePower: 13.5, afterPower: 13.7, specMin: 13.5, specMax: 15.0, status: 'Pass', unit: 'W' },
      ]
    },
    laser2: {
      name: 'UV Laser Source 2',
      serial: 'UV-2024-002-B',
      wavelength: '355nm',
      masks: [
        { idx: 1, aperture: '20μm', beforePower: 14.8, afterPower: 14.6, specMin: 14.0, specMax: 15.0, status: 'Pass', unit: 'W' },
        { idx: 2, aperture: '25μm', beforePower: 14.6, afterPower: 14.7, specMin: 14.0, specMax: 15.0, status: 'Pass', unit: 'W' },
        { idx: 3, aperture: '30μm', beforePower: 14.4, afterPower: 14.5, specMin: 14.0, specMax: 15.0, status: 'Pass', unit: 'W' },
        { idx: 4, aperture: '35μm', beforePower: 14.2, afterPower: 14.3, specMin: 13.5, specMax: 15.0, status: 'Pass', unit: 'W' },
        { idx: 5, aperture: '40μm', beforePower: 14.0, afterPower: 14.1, specMin: 13.5, specMax: 15.0, status: 'Pass', unit: 'W' },
        { idx: 6, aperture: '45μm', beforePower: 13.8, afterPower: 13.9, specMin: 13.5, specMax: 15.0, status: 'Pass', unit: 'W' },
      ]
    }
  },
  laserProfile: {
    productName: 'ST-WLVIA-7nm-001',
    waferSize: '300mm',
    laser1: {
      powerPhase1: 12.5, powerPhase2: 14.2,
      shotsPhase1: 2450000, shotsPhase2: 1890000,
      aperture: '25μm', maskIndex: 2,
      frequency: 80, unit: 'kHz'
    },
    laser2: {
      powerPhase1: 12.8, powerPhase2: 14.6,
      shotsPhase1: 2100000, shotsPhase2: 1950000,
      aperture: '25μm', maskIndex: 2,
      frequency: 80, unit: 'kHz'
    }
  },
  viaImages: {
    beforeDate: '2026-04-15',
    afterDate: '2026-07-27',
    beforeImgs: [],
    afterImgs: [],
    topDiameter: { before: '45.2μm', after: '42.1μm', spec: '40-45μm' },
    bottomDiameter: { before: '44.8μm', after: '41.9μm', spec: '40-45μm' },
    roundness: { before: '0.87', after: '0.94', spec: '>0.90' },
    shape: { before: 'Oval', after: 'Circular', spec: 'Circular' },
    notes: 'Via improved significantly after optics alignment. Roundness now within spec.'
  },
  focusOptimization: {
    summary: {
      title: 'Focus Optimization Report',
      description: 'Laser focal plane calibrated using interferometric distance sensor. Defocus range characterized from -20 μm to +20 μm relative to wafer surface.',
      date: '2026-07-27',
      operator: 'EO Technics FSE'
    },
    measurements: [
      { id: 1, title: 'Focus Position Z (Center)', value: '0.0 μm', tolerance: '±1.0 μm', status: 'Pass', image: '', note: 'Nominal focus at wafer surface plane.' },
      { id: 2, title: 'Focus Position Z (Edge)', value: '+0.3 μm', tolerance: '±1.5 μm', status: 'Pass', image: '', note: 'Slight field curvature detected at 300mm edge.' },
      { id: 3, title: 'Astigmatism ΔZ', value: '0.4 μm', tolerance: '< 1.0 μm', status: 'Pass', image: '', note: 'Within spec. No cylindrical correction needed.' },
      { id: 4, title: 'Working Distance', value: '14.52 mm', tolerance: '14.50 ± 0.05 mm', status: 'Pass', image: '', note: 'Measured from final objective flange to wafer.' },
    ],
    laserDefocus: {
      title: 'Laser Defocus Characterization',
      description: 'Via quality assessed across defocus sweep. Optimal process window identified between -5 μm and +5 μm.',
      items: [
        { id: 1, defocus: '-20 μm', viaSize: '38.2 μm', roundness: '0.71', quality: 'Poor', image: '', desc: 'Severe undercut. Energy density too low at focal plane.' },
        { id: 2, defocus: '-10 μm', viaSize: '41.5 μm', roundness: '0.84', quality: 'Marginal', image: '', desc: 'Acceptable but not optimal. Edge taper visible.' },
        { id: 3, defocus: '0 μm (Nominal)', viaSize: '42.8 μm', roundness: '0.96', quality: 'Excellent', image: '', desc: 'Target focus. Best roundness and cleanest sidewalls.' },
        { id: 4, defocus: '+10 μm', viaSize: '43.1 μm', roundness: '0.89', quality: 'Good', image: '', desc: 'Slight enlargement. Still within process window.' },
        { id: 5, defocus: '+20 μm', viaSize: '45.6 μm', roundness: '0.78', quality: 'Poor', image: '', desc: 'Overcut and debris. Energy density too high.' },
      ]
    }
  },
  powerOffset: {
    summary: {
      title: 'Power Offset Compensation Report',
      description: 'Dual-laser power offset measured per aperture mask. Offset compensation applied to maintain ±3% power uniformity across the field.',
      date: '2026-07-27'
    },
    items: [
      { id: 1, channel: 'Laser 1 — Mask 20μm', offset: '+1.2%', target: '±3%', compensated: 'Yes', before: '+1.2%', after: '+0.1%', image: '', desc: 'Minor positive offset. Software compensation active.' },
      { id: 2, channel: 'Laser 1 — Mask 25μm', offset: '-2.8%', target: '±3%', compensated: 'Yes', before: '-2.8%', after: '-0.2%', image: '', desc: 'Negative drift corrected via AOM bias adjustment.' },
      { id: 3, channel: 'Laser 1 — Mask 30μm', offset: '+0.5%', target: '±3%', compensated: 'No', before: '+0.5%', after: '+0.5%', image: '', desc: 'Within tolerance. No compensation required.' },
      { id: 4, channel: 'Laser 2 — Mask 20μm', offset: '+2.9%', target: '±3%', compensated: 'Yes', before: '+2.9%', after: '+0.3%', image: '', desc: 'Near limit. Compensated to prevent hotspot.' },
      { id: 5, channel: 'Laser 2 — Mask 25μm', offset: '-1.4%', target: '±3%', compensated: 'Yes', before: '-1.4%', after: '-0.1%', image: '', desc: 'Stable. Compensation applied as preventive measure.' },
      { id: 6, channel: 'Laser 2 — Mask 30μm', offset: '+0.8%', target: '±3%', compensated: 'No', before: '+0.8%', after: '+0.8%', image: '', desc: 'Well within spec. Monitor next quarter.' },
    ]
  },
  beamProfiles: {
    laser1: {
      title: 'Laser Source 1',
      items: [
        { idx: 1, aperture: '20μm', beforeImg: '', afterImg: '', beforeDate: '2026-04-15', afterDate: '2026-07-27', beamSizeBefore: '18.2μm', beamSizeAfter: '19.1μm', beamDiaBefore: '19.5μm', beamDiaAfter: '19.8μm', specSize: '18-20μm', specDia: '19-21μm', title: 'LS1 — Mask 20μm' },
        { idx: 2, aperture: '25μm', beforeImg: '', afterImg: '', beforeDate: '2026-04-15', afterDate: '2026-07-27', beamSizeBefore: '23.1μm', beamSizeAfter: '24.2μm', beamDiaBefore: '24.5μm', beamDiaAfter: '24.8μm', specSize: '23-25μm', specDia: '24-26μm', title: 'LS1 — Mask 25μm' },
        { idx: 3, aperture: '30μm', beforeImg: '', afterImg: '', beforeDate: '2026-04-15', afterDate: '2026-07-27', beamSizeBefore: '28.5μm', beamSizeAfter: '29.1μm', beamDiaBefore: '29.8μm', beamDiaAfter: '29.9μm', specSize: '28-30μm', specDia: '29-31μm', title: 'LS1 — Mask 30μm' },
        { idx: 4, aperture: '35μm', beforeImg: '', afterImg: '', beforeDate: '2026-04-15', afterDate: '2026-07-27', beamSizeBefore: '33.2μm', beamSizeAfter: '34.0μm', beamDiaBefore: '34.5μm', beamDiaAfter: '34.8μm', specSize: '33-35μm', specDia: '34-36μm', title: 'LS1 — Mask 35μm' },
        { idx: 5, aperture: '40μm', beforeImg: '', afterImg: '', beforeDate: '2026-04-15', afterDate: '2026-07-27', beamSizeBefore: '38.1μm', beamSizeAfter: '39.2μm', beamDiaBefore: '39.5μm', beamDiaAfter: '39.8μm', specSize: '38-40μm', specDia: '39-41μm', title: 'LS1 — Mask 40μm' },
      ]
    },
    laser2: {
      title: 'Laser Source 2',
      items: [
        { idx: 1, aperture: '20μm', beforeImg: '', afterImg: '', beforeDate: '2026-04-15', afterDate: '2026-07-27', beamSizeBefore: '18.5μm', beamSizeAfter: '19.3μm', beamDiaBefore: '19.8μm', beamDiaAfter: '20.0μm', specSize: '18-20μm', specDia: '19-21μm', title: 'LS2 — Mask 20μm' },
        { idx: 2, aperture: '25μm', beforeImg: '', afterImg: '', beforeDate: '2026-04-15', afterDate: '2026-07-27', beamSizeBefore: '23.5μm', beamSizeAfter: '24.4μm', beamDiaBefore: '24.8μm', beamDiaAfter: '25.0μm', specSize: '23-25μm', specDia: '24-26μm', title: 'LS2 — Mask 25μm' },
        { idx: 3, aperture: '30μm', beforeImg: '', afterImg: '', beforeDate: '2026-04-15', afterDate: '2026-07-27', beamSizeBefore: '28.8μm', beamSizeAfter: '29.3μm', beamDiaBefore: '30.1μm', beamDiaAfter: '30.2μm', specSize: '28-30μm', specDia: '29-31μm', title: 'LS2 — Mask 30μm' },
        { idx: 4, aperture: '35μm', beforeImg: '', afterImg: '', beforeDate: '2026-04-15', afterDate: '2026-07-27', beamSizeBefore: '33.5μm', beamSizeAfter: '34.2μm', beamDiaBefore: '34.8μm', beamDiaAfter: '35.0μm', specSize: '33-35μm', specDia: '34-36μm', title: 'LS2 — Mask 35μm' },
        { idx: 5, aperture: '40μm', beforeImg: '', afterImg: '', beforeDate: '2026-04-15', afterDate: '2026-07-27', beamSizeBefore: '38.5μm', beamSizeAfter: '39.4μm', beamDiaBefore: '39.8μm', beamDiaAfter: '40.0μm', specSize: '38-40μm', specDia: '39-41μm', title: 'LS2 — Mask 40μm' },
      ]
    }
  }
};

const listeners = new Set();

export function getState() { return structuredClone(state); }

export function setState(updater) {
  const prev = structuredClone(state);
  const next = typeof updater === 'function' ? updater(structuredClone(state)) : { ...state, ...updater };

  // Zod validation — reject corrupted updates with a clear error
  const result = validateState(next);
  if (!result.success) {
    console.error('[store] setState validation FAILED — change rejected:', result.error.flatMessage);
    window.dispatchEvent(new CustomEvent('state-validation-error', {
      detail: { message: result.error.flatMessage, issues: result.error.issues }
    }));
    return; // Do NOT apply corrupted state
  }

  state = result.data;

  // Audit trail — diff and log all meaningful parameter changes (fire-and-forget)
  auditStateChanges(prev, state).catch(e => console.error('[store] audit failed:', e));

  listeners.forEach(cb => cb(state));
}

export function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); }

// Convenience: direct read for modules that need the live reference (legacy compat)
export { state as appState };
