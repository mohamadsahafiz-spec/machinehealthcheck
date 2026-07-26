// src/sections/laser/via-images.js
// Via image comparison + edit modal

import { appState } from '../../state/store.js';
import { uploadAndStoreImage } from '../../state/persist.js';
import { openModalA11y, closeModalA11y } from '../../ui/modal-system.js';

function renderViaImageReport() {
  const container = document.getElementById('viaImageReport');
  if (!container) return;
  const vi = appState.viaImages;
  let html = '<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">';
  // Before images
  html += '<div class="glass rounded-xl p-5 border border-slate-700/50">';
  html += '<div class="flex items-center justify-between mb-3">';
  html += '<h3 class="font-semibold text-white flex items-center gap-2"><i class="fas fa-image text-slate-400"></i> Before (' + vi.beforeImgs.length + ')</h3>';
  html += '<span class="text-xs text-slate-500 font-mono">' + vi.beforeDate + '</span></div>';
  if (vi.beforeImgs.length > 0) {
    html += '<div class="grid grid-cols-2 gap-2 mb-3">';
    vi.beforeImgs.forEach((img, idx) => {
      html += '<div class="rounded-lg overflow-hidden cursor-pointer relative group" onclick="openViaImageModal()">';
      html += '<img src="' + img + '" style="width:100%; height:140px; object-fit:cover;">';
      html += '<div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"></div>';
      html += '</div>';
    });
    html += '</div>';
  } else {
    html += '<div class="grid grid-cols-2 gap-2 mb-3">';
    html += '<div class="rounded-lg bg-slate-800/50 flex items-center justify-center" style="height:140px;"><span class="text-xs text-slate-600">No image</span></div>';
    html += '<div class="rounded-lg bg-slate-800/50 flex items-center justify-center" style="height:140px;"><span class="text-xs text-slate-600">No image</span></div>';
    html += '</div>';
  }
  html += '<button onclick="openViaImageModal()" class="w-full py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 text-xs hover:bg-slate-700/50 hover:text-white transition-all flex items-center justify-center gap-2">';
  html += '<i class="fas fa-edit"></i> Edit before images</button>';
  html += '</div>';
  // After images
  html += '<div class="glass rounded-xl p-5 border border-neon-green/20">';
  html += '<div class="flex items-center justify-between mb-3">';
  html += '<h3 class="font-semibold text-white flex items-center gap-2"><i class="fas fa-image text-neon-green"></i> After (' + vi.afterImgs.length + ')</h3>';
  html += '<span class="text-xs text-slate-500 font-mono">' + vi.afterDate + '</span></div>';
  if (vi.afterImgs.length > 0) {
    html += '<div class="grid grid-cols-2 gap-2 mb-3">';
    vi.afterImgs.forEach((img, idx) => {
      html += '<div class="rounded-lg overflow-hidden cursor-pointer relative group" onclick="openViaImageModal()">';
      html += '<img src="' + img + '" style="width:100%; height:140px; object-fit:cover;">';
      html += '<div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"></div>';
      html += '</div>';
    });
    html += '</div>';
  } else {
    html += '<div class="grid grid-cols-2 gap-2 mb-3">';
    html += '<div class="rounded-lg bg-slate-800/50 flex items-center justify-center" style="height:140px;"><span class="text-xs text-slate-600">No image</span></div>';
    html += '<div class="rounded-lg bg-slate-800/50 flex items-center justify-center" style="height:140px;"><span class="text-xs text-slate-600">No image</span></div>';
    html += '</div>';
  }
  html += '<button onclick="openViaImageModal()" class="w-full py-2 rounded-lg bg-neon-green/5 border border-neon-green/20 text-neon-green text-xs hover:bg-neon-green/10 transition-all flex items-center justify-center gap-2">';
  html += '<i class="fas fa-edit"></i> Edit after images</button>';
  html += '</div>';
  html += '</div>';
  // Metrics
  html += '<div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">';
  const metrics = [
    { label: 'Top Diameter', before: vi.topDiameter.before, after: vi.topDiameter.after, spec: vi.topDiameter.spec, icon: 'fa-ruler' },
    { label: 'Bottom Diameter', before: vi.bottomDiameter.before, after: vi.bottomDiameter.after, spec: vi.bottomDiameter.spec, icon: 'fa-circle' },
    { label: 'Roundness', before: vi.roundness.before, after: vi.roundness.after, spec: vi.roundness.spec, icon: 'fa-bullseye' },
  ];
  metrics.forEach(m => {
    html += '<div class="glass rounded-xl p-4 border border-slate-700/50">';
    html += '<div class="flex items-center gap-2 mb-2"><i class="fas ' + m.icon + ' text-neon-amber"></i><span class="text-xs text-slate-400">' + m.label + '</span></div>';
    html += '<div class="flex items-center gap-2 mb-1">';
    html += '<span class="text-sm font-bold text-slate-500">' + m.before + '</span>';
    html += '<i class="fas fa-arrow-right text-xs text-slate-600"></i>';
    html += '<span class="text-sm font-bold text-neon-green">' + m.after + '</span>';
    html += '</div>';
    html += '<p class="text-[10px] text-slate-500">Spec: ' + m.spec + '</p>';
    html += '</div>';
  });
  html += '</div>';
  // Notes
  if (vi.notes) {
    html += '<div class="mt-4 p-4 rounded-lg bg-neon-amber/5 border border-neon-amber/10">';
    html += '<p class="text-xs text-slate-400"><i class="fas fa-sticky-note text-neon-amber mr-1"></i> ' + vi.notes + '</p>';
    html += '</div>';
  }
  container.innerHTML = html;
}

function openViaImageModal() {
  renderViaImageEdit();
  openModalA11y('viaImageModal');
}

function closeViaImageModal() { closeModalA11y('viaImageModal'); }

function renderViaImageEdit() {
  const container = document.getElementById('viaImageEditContent');
  const vi = appState.viaImages;
  let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
  html += '<div><span class="edit-label">Before Date</span><input type="date" class="edit-input" id="vi-bdate" value="' + vi.beforeDate + '"></div>';
  html += '<div><span class="edit-label">After Date</span><input type="date" class="edit-input" id="vi-adate" value="' + vi.afterDate + '"></div>';
  html += '</div>';
  html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">';
  html += '<div><span class="edit-label">Before Image</span>';
  html += '<div class="image-upload-slot" onclick="document.getElementById(\'vi-bimg\').click()" id="vi-bslot" style="min-height:160px;">';
  if (vi.beforeImg) {
    html += '<img src="' + vi.beforeImg + '" style="max-height:140px; border-radius:6px;">';
  } else {
    html += '<i class="fas fa-camera text-slate-500 text-2xl mb-2"></i><p class="text-xs text-slate-400">Click to upload before image</p>';
  }
  html += '<input type="file" id="vi-bimg" accept="image/*" style="display:none" onchange="handleViaImage(this,\'before\')">';
  html += '</div></div>';
  html += '<div><span class="edit-label">After Image</span>';
  html += '<div class="image-upload-slot" onclick="document.getElementById(\'vi-aimg\').click()" id="vi-aslot" style="min-height:160px;">';
  if (vi.afterImg) {
    html += '<img src="' + vi.afterImg + '" style="max-height:140px; border-radius:6px;">';
  } else {
    html += '<i class="fas fa-camera text-slate-500 text-2xl mb-2"></i><p class="text-xs text-slate-400">Click to upload after image</p>';
  }
  html += '<input type="file" id="vi-aimg" accept="image/*" style="display:none" onchange="handleViaImage(this,\'after\')">';
  html += '</div></div>';
  html += '</div>';
  html += '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">';
  html += '<div><span class="edit-label">Top Diameter Before</span><input type="text" class="edit-input" id="vi-vsb" value="' + vi.topDiameter.before + '"></div>';
  html += '<div><span class="edit-label">Top Diameter After</span><input type="text" class="edit-input" id="vi-vsa" value="' + vi.topDiameter.after + '"></div>';
  html += '<div><span class="edit-label">Top Diameter Spec</span><input type="text" class="edit-input" id="vi-vss" value="' + vi.topDiameter.spec + '"></div>';
  html += '<div></div>';
  html += '<div><span class="edit-label">Bottom Diameter Before</span><input type="text" class="edit-input" id="vi-vdb" value="' + vi.bottomDiameter.before + '"></div>';
  html += '<div><span class="edit-label">Bottom Diameter After</span><input type="text" class="edit-input" id="vi-vda" value="' + vi.bottomDiameter.after + '"></div>';
  html += '<div><span class="edit-label">Bottom Diameter Spec</span><input type="text" class="edit-input" id="vi-vds" value="' + vi.bottomDiameter.spec + '"></div>';
  html += '<div></div>';
  html += '<div><span class="edit-label">Shape Before</span><input type="text" class="edit-input" id="vi-shb" value="' + vi.shape.before + '"></div>';
  html += '<div><span class="edit-label">Shape After</span><input type="text" class="edit-input" id="vi-sha" value="' + vi.shape.after + '"></div>';
  html += '<div><span class="edit-label">Shape Spec</span><input type="text" class="edit-input" id="vi-shs" value="' + vi.shape.spec + '"></div>';
  html += '<div></div>';
  html += '<div><span class="edit-label">Roundness Before</span><input type="text" class="edit-input" id="vi-rnb" value="' + vi.roundness.before + '"></div>';
  html += '<div><span class="edit-label">Roundness After</span><input type="text" class="edit-input" id="vi-rna" value="' + vi.roundness.after + '"></div>';
  html += '<div><span class="edit-label">Roundness Spec</span><input type="text" class="edit-input" id="vi-rns" value="' + vi.roundness.spec + '"></div>';
  html += '</div>';
  html += '<div class="mt-4"><span class="edit-label">Notes</span><textarea class="edit-textarea" id="vi-notes" rows="2">' + vi.notes + '</textarea></div>';
  container.innerHTML = html;
}

async function handleViaImage(input, type) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { alert('Image too large (max 5MB).'); input.value = ''; return; }
  try {
    const idx = appState.viaImages[type + 'Imgs'].length;
    const objectUrl = await uploadAndStoreImage(file, 'via-' + type + '-' + idx);
    appState.viaImages[type + 'Imgs'].push(objectUrl);
    renderViaImageEdit();
  } catch (e) {
    console.error('Via image upload failed', e);
  }
}

function addViaImage(type) {
  const inputId = type === 'before' ? 'vi-bimg-add' : 'vi-aimg-add';
  document.getElementById(inputId).click();
}

function removeViaImage(idx, type) {
  appState.viaImages[type + 'Imgs'].splice(idx, 1);
  renderViaImageEdit();
}

function saveViaImageData() {
  const vi = appState.viaImages;
  vi.beforeDate = document.getElementById('vi-bdate').value;
  vi.afterDate = document.getElementById('vi-adate').value;
  vi.topDiameter.before = document.getElementById('vi-vsb').value;
  vi.topDiameter.after = document.getElementById('vi-vsa').value;
  vi.topDiameter.spec = document.getElementById('vi-vss').value;
  vi.bottomDiameter.before = document.getElementById('vi-vdb').value;
  vi.bottomDiameter.after = document.getElementById('vi-vda').value;
  vi.bottomDiameter.spec = document.getElementById('vi-vds').value;
  vi.roundness.before = document.getElementById('vi-rnb').value;
  vi.roundness.after = document.getElementById('vi-rna').value;
  vi.roundness.spec = document.getElementById('vi-rns').value;
  vi.shape.before = document.getElementById('vi-shb').value;
  vi.shape.after = document.getElementById('vi-sha').value;
  vi.shape.spec = document.getElementById('vi-shs').value;
  vi.notes = document.getElementById('vi-notes').value;
  renderViaImageReport();
  closeViaImageModal();
}
