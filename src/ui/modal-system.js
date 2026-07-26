// src/ui/modal-system.js
export function openModalA11y(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('active');
    el.setAttribute('aria-hidden', 'false');
    const focusable = el.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
  }
}

export function closeModalA11y(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('active');
    el.setAttribute('aria-hidden', 'true');
  }
}
