// src/state/persist.js
import { subscribe, getState, setState } from './store.js';
import { validateState, validateStateStrict } from './schema.js';
import { dbPut, dbGet, storeImage, loadImage, deleteImage } from './db.js';

const STORAGE_KEY = 'eo-fse-v8-state';

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Zod strict validation on load — corrupted data gets cleared with a clear error
      try {
        return validateStateStrict(parsed);
      } catch (validationErr) {
        console.error('[persist] Loaded state failed validation:', validationErr.message);
        localStorage.removeItem(STORAGE_KEY);
        throw new Error(`Saved dashboard data was corrupted and has been reset.\nDetails: ${validationErr.message}`);
      }
    }
  } catch (e) {
    console.error('Load failed', e);
    throw e;
  }
  return null;
}

export function saveState(state) {
  try {
    // Validate before saving — never persist corrupted data
    const result = validateState(state);
    if (!result.success) {
      console.error('[persist] saveState validation FAILED — aborting persist:', result.error.flatMessage);
      return;
    }

    const clone = structuredClone(result.data);
    // Strip all image blobs/base64 from JSON snapshot — images live in IndexedDB
    if (clone.viaImages) { clone.viaImages.beforeImgs = []; clone.viaImages.afterImgs = []; }
    if (clone.beamProfiles) {
      Object.values(clone.beamProfiles).forEach(l => {
        l.items.forEach(i => { i.beforeImg = ''; i.afterImg = ''; });
      });
    }
    if (clone.focusOptimization) {
      clone.focusOptimization.measurements.forEach(m => m.image = '');
      clone.focusOptimization.laserDefocus.items.forEach(i => i.image = '');
    }
    if (clone.powerOffset) {
      clone.powerOffset.items.forEach(i => i.image = '');
    }
    // Strip reportState images too
    if (clone.reportState && clone.reportState.images) clone.reportState.images = {};

    localStorage.setItem(STORAGE_KEY, JSON.stringify(clone));
  } catch (e) { console.error('Save failed', e); }
}

export function initAutoSave() {
  subscribe(debounce((state) => saveState(state), 500));
}

// Image upload wrapper: stores File → Blob in IndexedDB, returns object URL
export async function uploadAndStoreImage(inputFile, slotId) {
  const objectUrl = await storeImage(slotId, inputFile);
  return objectUrl;
}

// Restore all images from IndexedDB into the DOM after state load
export async function restoreImages(state) {
  const promises = [];

  // Via images
  if (state.viaImages) {
    state.viaImages.beforeImgs = [];
    state.viaImages.afterImgs = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        loadImage(`via-before-${i}`).then(url => { if (url) state.viaImages.beforeImgs.push(url); }).catch(() => {})
      );
      promises.push(
        loadImage(`via-after-${i}`).then(url => { if (url) state.viaImages.afterImgs.push(url); }).catch(() => {})
      );
    }
  }

  // Beam profile images
  if (state.beamProfiles) {
    ['laser1', 'laser2'].forEach(lk => {
      state.beamProfiles[lk].items.forEach((item, idx) => {
        promises.push(
          loadImage(`beam-${lk}-${idx}-before`).then(url => { if (url) item.beforeImg = url; }).catch(() => {})
        );
        promises.push(
          loadImage(`beam-${lk}-${idx}-after`).then(url => { if (url) item.afterImg = url; }).catch(() => {})
        );
      });
    });
  }

  // Focus images
  if (state.focusOptimization) {
    state.focusOptimization.measurements.forEach((m, idx) => {
      promises.push(
        loadImage(`focus-meas-${idx}`).then(url => { if (url) m.image = url; }).catch(() => {})
      );
    });
    state.focusOptimization.laserDefocus.items.forEach((item, idx) => {
      promises.push(
        loadImage(`focus-defocus-${idx}`).then(url => { if (url) item.image = url; }).catch(() => {})
      );
    });
  }

  // Power offset images
  if (state.powerOffset) {
    state.powerOffset.items.forEach((item, idx) => {
      promises.push(
        loadImage(`power-offset-${idx}`).then(url => { if (url) item.image = url; }).catch(() => {})
      );
    });
  }

  await Promise.all(promises);
  return state;
}
