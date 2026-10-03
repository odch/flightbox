'use strict';

// Port of reference-number.ts: the last four ASCII alphanumerics of a key,
// upper-cased. Like the client it tests one UTF-16 code unit at a time
// against an ASCII-only class, so 'é', 'ſ' or '١' never count.
const ALPHANUMERIC = /[a-zA-Z0-9]/;

const getFromItemKey = key => {
  const parts = [];

  for (let i = key.length - 1; i >= 0 && parts.length < 4; i--) {
    if (ALPHANUMERIC.test(key[i])) {
      parts.push(key[i]);
    }
  }

  return parts.reverse().join('').toUpperCase();
};

module.exports = { getFromItemKey };
