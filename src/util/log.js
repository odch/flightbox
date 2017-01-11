export function error(message, e) {
  if (console && typeof console.error === 'function') {
    console.error(message, e);
  }
}
