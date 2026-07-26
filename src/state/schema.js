// src/state/schema.js
export function validateState(state) {
  return { success: true, data: state, error: null };
}
export function validateStateStrict(state) {
  return state;
}
