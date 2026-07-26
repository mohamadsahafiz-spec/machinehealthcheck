// src/state/store.js
export let appState = {
  machineSequence: [1, 2, 3, 4, 5],
  machineCount: 5,
  totalDays: 80,
  totalUsed: 0,
  totalVisits: 0,
  visits: [],
  reportsSubmitted: 0,
  startDate: '2026-07-20',
  contractYears: 2,
  dayPattern: [3, 2, 3, 2],
  laserParams: [],
  spareParts: [],
  laserPowerMonitor: {
    laser1: { name: 'UV Laser Source 1', serial: 'UV-2024-A001', wavelength: '355nm', masks: [] },
    laser2: { name: 'UV Laser Source 2', serial: 'UV-2024-A002', wavelength: '355nm', masks: [] }
  },
  laserProfile: {
    productName: 'Product A',
    waferSize: '300mm',
    laser1: { powerPhase1: 0, powerPhase2: 0, shotsPhase1: 0, shotsPhase2: 0, aperture: '2.0mm', maskIndex: 1, frequency: 80 },
    laser2: { powerPhase1: 0, powerPhase2: 0, shotsPhase1: 0, shotsPhase2: 0, aperture: '2.0mm', maskIndex: 1, frequency: 80 }
  },
  viaImages: {
    beforeImgs: [],
    afterImgs: [],
    beforeDate: '',
    afterDate: '',
    beforeImg: '',
    afterImg: '',
    topDiameter: { before: '-', after: '-', spec: '-' },
    bottomDiameter: { before: '-', after: '-', spec: '-' },
    roundness: { before: '-', after: '-', spec: '-' },
    shape: { before: '-', after: '-', spec: '-' },
    notes: ''
  },
  beamProfiles: {
    laser1: { title: 'Laser Source 1', items: [] },
    laser2: { title: 'Laser Source 2', items: [] }
  },
  focusOptimization: {
    summary: { description: '', date: '', operator: '' },
    measurements: [],
    laserDefocus: { description: '', items: [] }
  },
  powerOffset: {
    summary: { description: '', date: '' },
    items: []
  },
  terms: [],
  insights: []
};

export function getState() { return appState; }
export function setState(newState) { appState = { ...appState, ...newState }; }
export function subscribe(cb) {
  // Stub: in a real implementation this would notify on state changes
}
