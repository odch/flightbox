
function getFromItemKey(key) {
  const parts = [];

  for (let i = key.length - 1; i >= 0 && parts.length < 4; i--) {
    if (/[a-zA-Z0-9]/.test(key[i])) {
      parts.push(key[i]);
    }
  }

  parts.reverse();

  return parts.join('').toUpperCase();
}

export { getFromItemKey };
