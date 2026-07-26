// src/ui/modal-system.js
export function openModalA11y(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusable) focusable.focus();
  document.body.style.overflow = 'hidden';
}

export function closeModalA11y(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
