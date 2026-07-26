// src/ui/change-log-modal.js
import { openModalA11y, closeModalA11y } from './modal-system.js';

let changeLogEntries = [];
let changeLogFilters = { user: '', action: '', machine: '', field: '' };

function initDemoEntries() {
  const now = new Date();
  changeLogEntries = [
    {
      id: 1,
      timestamp: new Date(now - 3600000 * 2).toISOString(),
      user: 'FSE-001',
      action: 'update',
      machine: 'WLVIA #1',
      field: 'Laser Power',
      before: '85%',
      after: '92%'
    },
    {
      id: 2,
      timestamp: new Date(now - 3600000 * 5).toISOString(),
      user: 'FSE-001',
      action: 'update',
      machine: 'WLVIA #2',
      field: 'Scanner Mirror',
      before: 'OK',
      after: 'Replace ASAP'
    },
    {
      id: 3,
      timestamp: new Date(now - 3600000 * 24).toISOString(),
      user: 'Admin',
      action: 'create',
      machine: 'WLVIA #3',
      field: 'New Visit',
      before: '-',
      after: 'Scheduled WK32'
    },
    {
      id: 4,
      timestamp: new Date(now - 3600000 * 48).toISOString(),
      user: 'FSE-001',
      action: 'update',
      machine: 'WLVIA #1',
      field: 'CDA Pressure Day 1',
      before: '520 kPa',
      after: '645 kPa'
    },
    {
      id: 5,
      timestamp: new Date(now - 3600000 * 72).toISOString(),
      user: 'FSE-002',
      action: 'delete',
      machine: 'WLVIA #4',
      field: 'Old Spare Part Entry',
      before: 'Lens — $1,200',
      after: '-'
    }
  ];
}

function formatTimestamp(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

function getActionBadge(action) {
  const map = {
    create: 'bg-neon-green/10 text-neon-green border-neon-green/20',
    update: 'bg-neon-blue/10 text-neon-blue border-neon-blue/20',
    delete: 'bg-neon-red/10 text-neon-red border-neon-red/20'
  };
  return map[action] || map.update;
}

export function openChangeLogModal() {
  renderChangeLogFilters();
  renderChangeLogTable();
  openModalA11y('changeLogModal');
}

export function closeChangeLogModal() {
  closeModalA11y('changeLogModal');
}

export function addChangeLogEntry(entry) {
  const newEntry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    user: entry.user || 'FSE-001',
    action: entry.action || 'update',
    machine: entry.machine || '-',
    field: entry.field || '-',
    before: String(entry.before ?? '-'),
    after: String(entry.after ?? '-')
  };
  changeLogEntries.unshift(newEntry);
  if (changeLogEntries.length > 200) {
    changeLogEntries = changeLogEntries.slice(0, 200);
  }
  const modal = document.getElementById('changeLogModal');
  if (modal && modal.classList.contains('active')) {
    renderChangeLogTable();
  }
}

function renderChangeLogFilters() {
  const container = document.getElementById('changeLogFilters');
  if (!container) return;
  container.innerHTML = `
    <div class="flex flex-wrap gap-3 items-end">
      <div>
        <span class="edit-label" style="font-size:10px;">User</span>
        <input type="text" class="edit-input" style="padding:6px 8px; font-size:12px;" id="cl-filter-user"
          value="${changeLogFilters.user}" placeholder="Filter by user..."
          oninput="window.updateChangeLogFilter('user', this.value)">
      </div>
      <div>
        <span class="edit-label" style="font-size:10px;">Action</span>
        <select class="edit-select" style="padding:6px 8px; font-size:12px;" id="cl-filter-action"
          onchange="window.updateChangeLogFilter('action', this.value)">
          <option value="">All</option>
          <option value="create" ${changeLogFilters.action === 'create' ? 'selected' : ''}>Create</option>
          <option value="update" ${changeLogFilters.action === 'update' ? 'selected' : ''}>Update</option>
          <option value="delete" ${changeLogFilters.action === 'delete' ? 'selected' : ''}>Delete</option>
        </select>
      </div>
      <div>
        <span class="edit-label" style="font-size:10px;">Machine</span>
        <input type="text" class="edit-input" style="padding:6px 8px; font-size:12px;" id="cl-filter-machine"
          value="${changeLogFilters.machine}" placeholder="Filter by machine..."
          oninput="window.updateChangeLogFilter('machine', this.value)">
      </div>
      <div>
        <span class="edit-label" style="font-size:10px;">Field</span>
        <input type="text" class="edit-input" style="padding:6px 8px; font-size:12px;" id="cl-filter-field"
          value="${changeLogFilters.field}" placeholder="Filter by field..."
          oninput="window.updateChangeLogFilter('field', this.value)">
      </div>
      <button onclick="window.clearChangeLogFilters()" class="btn-sm"
        style="background:rgba(239,68,68,0.1); border-color:rgba(239,68,68,0.3); color:#ef4444;">
        <i class="fas fa-times mr-1"></i> Clear
      </button>
    </div>
  `;
}

window.updateChangeLogFilter = function(key, value) {
  changeLogFilters[key] = value.toLowerCase();
  renderChangeLogTable();
};

window.clearChangeLogFilters = function() {
  changeLogFilters = { user: '', action: '', machine: '', field: '' };
  renderChangeLogFilters();
  renderChangeLogTable();
};

function renderChangeLogTable() {
  const tbody = document.getElementById('changeLogTableBody');
  const countEl = document.getElementById('changeLogCount');
  if (!tbody) return;

  let filtered = changeLogEntries.filter(e => {
    return (!changeLogFilters.user || e.user.toLowerCase().includes(changeLogFilters.user)) &&
           (!changeLogFilters.action || e.action === changeLogFilters.action) &&
           (!changeLogFilters.machine || e.machine.toLowerCase().includes(changeLogFilters.machine)) &&
           (!changeLogFilters.field || e.field.toLowerCase().includes(changeLogFilters.field));
  });

  if (countEl) countEl.textContent = filtered.length + ' entries';

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-xs text-slate-500">No entries match the current filters.</td></tr>`;
    return;
  }

  let html = '';
  filtered.forEach((entry, idx) => {
    const actionClass = getActionBadge(entry.action);
    const rowBg = idx % 2 === 0 ? 'bg-slate-800/20' : 'bg-transparent';
    html += `<tr class="${rowBg} hover:bg-slate-700/20 transition-colors">
      <td class="py-2 px-3 text-xs text-slate-300 font-mono whitespace-nowrap">${formatTimestamp(entry.timestamp)}</td>
      <td class="py-2 px-3 text-xs text-slate-300">${entry.user}</td>
      <td class="py-2 px-3"><span class="px-2 py-0.5 rounded text-[10px] border ${actionClass} uppercase font-semibold">${entry.action}</span></td>
      <td class="py-2 px-3 text-xs text-neon-blue font-medium">${entry.machine}</td>
      <td class="py-2 px-3 text-xs text-slate-300">${entry.field}</td>
      <td class="py-2 px-3 text-xs text-slate-500 font-mono">${entry.before}</td>
      <td class="py-2 px-3 text-xs text-neon-green font-mono">${entry.after}</td>
    </tr>`;
  });
  tbody.innerHTML = html;
}

initDemoEntries();

window.openChangeLogModal = openChangeLogModal;
window.closeChangeLogModal = closeChangeLogModal;
window.addChangeLogEntry = addChangeLogEntry;
