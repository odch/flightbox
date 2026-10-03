// Oracle: the server reference number must match the client for any key.
const {getFromItemKey} = require('../../../functions/reports/airstat/referenceNumber');
const {mulberry32} = require('../../../functions/reports/airstat/testing/mulberry32');
const {getFromItemKey: clientGetFromItemKey} = require('../reference-number');

const PUSH_ID_ALPHABET =
  '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
// RTDB keys may hold any of these. Long s and the Kelvin sign case-fold to
// ASCII under an i/u regex, sharp s and ff upper-case to two letters, then
// accented letters, non-ASCII digits, fullwidth forms, an astral digit, an
// emoji, lone surrogates, a combining mark and punctuation.
const NON_ASCII_CHARS = [
  'é', 'ſ', 'K', 'ß', 'ﬀ', 'ı', 'İ',
  'µ', '٣', '²', 'Ａ', 'ｚ', '𝟘',
  '😀', '\uD800', '\uDFFF', '́', ' ', '~', '!', '%',
];
const CIRCUITS_KEY_SUFFIX = '_circuits';
const SEED = 20261003;
const COUNT = 10000;
const WIDE_SEED = 20261004;
const WIDE_COUNT = 5000;

const pick = (rand, list) => list[Math.floor(rand() * list.length)];

function randomKey(rand, nextChar) {
  const length = Math.floor(rand() * 26);
  let key = '';
  for (let i = 0; i < length; i++) {
    key += nextChar(rand);
  }
  return key;
}

function compareWithClient(candidates) {
  const mismatches = [];
  const outputs = new Set();
  candidates.forEach(candidate => {
    const expected = clientGetFromItemKey(candidate);
    const actual = getFromItemKey(candidate);
    outputs.add(expected);
    if (actual !== expected) {
      mismatches.push({candidate, expected, actual});
    }
  });
  return {mismatches, outputs};
}

function outcome(fn, input) {
  try {
    return {value: fn(input)};
  } catch (e) {
    return {error: e.name, message: e.message};
  }
}

describe('util', () => {
  describe('airstatOracles/referenceNumber', () => {
    it(`matches the client on ${COUNT} push-id keys and their _circuits variants (seed ${SEED})`, () => {
      const rand = mulberry32(SEED);
      const candidates = [];
      for (let i = 0; i < COUNT; i++) {
        const key = randomKey(rand, r => pick(r, PUSH_ID_ALPHABET));
        const cut = 1 + Math.floor(rand() * (CIRCUITS_KEY_SUFFIX.length - 1));
        candidates.push(key, key + CIRCUITS_KEY_SUFFIX, key + CIRCUITS_KEY_SUFFIX.slice(0, cut));
      }

      const {mismatches, outputs} = compareWithClient(candidates);

      expect(mismatches.slice(0, 10)).toEqual([]);
      expect(outputs.size).toBeGreaterThan(COUNT / 2);
    });

    it(`matches the client on ${WIDE_COUNT} keys mixing in non-ASCII code units (seed ${WIDE_SEED})`, () => {
      const rand = mulberry32(WIDE_SEED);
      const nextChar = r => (r() < 0.5 ? pick(r, PUSH_ID_ALPHABET) : pick(r, NON_ASCII_CHARS));
      const candidates = [];
      for (let i = 0; i < WIDE_COUNT; i++) {
        const key = randomKey(rand, nextChar);
        const cut = Math.floor(rand() * (CIRCUITS_KEY_SUFFIX.length + 1));
        candidates.push(key, key + CIRCUITS_KEY_SUFFIX.slice(0, cut));
      }

      const {mismatches, outputs} = compareWithClient(candidates);

      expect(mismatches.slice(0, 10)).toEqual([]);
      expect(outputs.size).toBeGreaterThan(WIDE_COUNT / 2);
    });

    it('returns or throws like the client for non-string keys', () => {
      const inputs = [
        undefined, null, 42, true, {}, [], ['a', '-', 'b', 'c', 'd', 'e'],
        {length: 3, 0: 'x', 2: 'y'}, Object('ab-cd'),
      ];

      expect(inputs.map(input => outcome(getFromItemKey, input)))
        .toEqual(inputs.map(input => outcome(clientGetFromItemKey, input)));
    });
  });
});
