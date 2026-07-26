// src/core/lifecycle.js
// Provides a clean way for section modules to trigger a global re-render
// without creating circular ES-module dependencies.

let renderAllFn = null;

export function registerRenderAll(fn) {
  renderAllFn = fn;
}

export function triggerRenderAll() {
  if (typeof renderAllFn === 'function') {
    renderAllFn();
  }
}
