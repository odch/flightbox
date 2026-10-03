// Oracle: the server sorted insert must order items, ties included, exactly
// like the client ItemsArray and report the same insert() results.
const {createItemsArray} = require('../../../functions/reports/airstat/sortedInsert');
const {mulberry32} = require('../../../functions/reports/airstat/testing/mulberry32');
const ItemsArray = require('../ItemsArray').default;

const SEED = 20261003;
const QUIRKY_SEED = 20261005;
const SEQUENCES = 500;
const SPECIAL_KEYS = ['constructor', '__proto__', 'toString', 'valueOf', '1'];
const REGISTRATIONS = ['HBABC', 'HBXYZ', 'DEFGH', 'hbabc', undefined, 42];

const byValue = (a, b) => a.v - b.v;

// Like compareAscending: a tie falls back to localeCompare, which throws for
// a numeric registration. Some pairs also compare as NaN.
const quirkyCompare = (a, b) => {
  if (a.nan || b.nan) return NaN;
  if (a.v !== b.v) return a.v - b.v;
  return (a.reg || '').localeCompare(b.reg || '');
};

const pick = (rand, values) => values[Math.floor(rand() * values.length)];

function randomSequence(rand) {
  const length = 1 + Math.floor(rand() * (rand() < 0.1 ? 400 : 60));
  const distinctValues = 1 + Math.floor(rand() * 5);
  const keyPool = 1 + Math.floor(rand() * length);
  const items = [];
  for (let i = 0; i < length; i++) {
    const roll = rand();
    let key;
    if (roll < 0.03) {
      key = pick(rand, SPECIAL_KEYS);
    } else if (roll < 0.05) {
      key = 1;
    } else {
      key = `k${Math.floor(rand() * keyPool)}`;
    }
    items.push({
      key,
      v: Math.floor(rand() * distinctValues),
      reg: pick(rand, REGISTRATIONS),
      nan: rand() < 0.05,
      i,
    });
  }
  return items;
}

function outcome(fn) {
  try {
    return fn();
  } catch (e) {
    return `${e.name}: ${e.message}`;
  }
}

function compareWithClient(seed, comparator) {
  const rand = mulberry32(seed);
  const mismatches = [];
  const stats = {ties: 0, throws: 0, rejected: 0};

  for (let s = 0; s < SEQUENCES; s++) {
    const sequence = randomSequence(rand);
    const client = new ItemsArray([], comparator);
    const server = createItemsArray(comparator);

    const expectedResults = sequence.map(item => outcome(() => client.insert(item)));
    const actualResults = sequence.map(item => outcome(() => server.insert(item)));
    const expectedOrder = client.array.map(item => item.i);
    const actualOrder = server.array.map(item => item.i);

    stats.ties += expectedOrder.length - new Set(client.array.map(item => item.v)).size;
    stats.throws += expectedResults.filter(result => typeof result === 'string').length;
    stats.rejected += expectedResults.filter(result => result === false).length;

    if (JSON.stringify(actualResults) !== JSON.stringify(expectedResults) ||
      JSON.stringify(actualOrder) !== JSON.stringify(expectedOrder)) {
      mismatches.push({s, sequence, expectedResults, actualResults, expectedOrder, actualOrder});
    }
  }

  expect(mismatches.slice(0, 3)).toEqual([]);
  return stats;
}

describe('util', () => {
  describe('airstatOracles/sortedInsert', () => {
    it(`matches ItemsArray on ${SEQUENCES} tie-heavy sequences (seed ${SEED})`, () => {
      const stats = compareWithClient(SEED, byValue);
      expect(stats.ties).toBeGreaterThan(SEQUENCES * 5);
      expect(stats.rejected).toBeGreaterThan(SEQUENCES * 5);
    });

    it(`matches ItemsArray with throwing and NaN comparisons (seed ${QUIRKY_SEED})`, () => {
      const stats = compareWithClient(QUIRKY_SEED, quirkyCompare);
      expect(stats.throws).toBeGreaterThan(SEQUENCES);
      expect(stats.ties).toBeGreaterThan(SEQUENCES * 5);
    });

    it.each([
      ['key undefined', {v: 1}],
      ['key null', {key: null, v: 1}],
      ['key ""', {key: '', v: 1}],
      ['key 0', {key: 0, v: 1}],
      ['key false', {key: false, v: 1}],
      ['key NaN', {key: NaN, v: 1}],
      ['item null', null],
      ['item undefined', undefined],
    ])('throws like ItemsArray for %s', (name, item) => {
      const client = new ItemsArray([], byValue);
      const server = createItemsArray(byValue);
      const expected = outcome(() => client.insert(item));
      expect(typeof expected).toBe('string');
      expect(outcome(() => server.insert(item))).toBe(expected);
      expect(server.array).toEqual(client.array);
    });
  });
});
