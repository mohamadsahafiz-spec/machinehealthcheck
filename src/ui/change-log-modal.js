// src/ui/change-log-modal.js
export function openChangeLogModal() {
  const el = document.getElementById('changeLogModal');
  if (el) el.classList.add('active');
}

export function closeChangeLogModal() {
  const el = document.getElementById('changeLogModal');
  if (el) el.classList.remove('active');
}

export function addChangeLogEntry(entry) {
  const list = document.getElementById('changeLogList');
  if (!list) return;
  const item = document.createElement('div');
  item.className = 'p-2 rounded bg-slate-800/50 text-xs text-slate-300 mb-1';
  item.innerHTML = `<span class="text-neon-blue">${entry.action}</span> — ${entry.machine} · ${entry.field}`;
  list.prepend(item);
}
