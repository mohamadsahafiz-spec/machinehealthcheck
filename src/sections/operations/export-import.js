// src/sections/operations/export-import.js
export function exportContract() {
  const data = JSON.stringify({ /* appState snapshot */ }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'eo-fse-contract.json';
  a.click();
  URL.revokeObjectURL(url);
}

export async function importContract(file) {
  const text = await file.text();
  return JSON.parse(text);
}
