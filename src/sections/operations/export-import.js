// src/sections/operations/export-import.js
import { appState } from '../../state/store.js';

export function exportContract() {
  const data = JSON.stringify(appState, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'contract-backup.json';
  a.click();
  URL.revokeObjectURL(url);
  return data;
}

export async function importContract(file) {
  const text = await file.text();
  return JSON.parse(text);
}
