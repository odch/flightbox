// Oracle: the engine's compareAscending must order like the client's
// (src/util/movements.ts), which compares the instants it gets back from
// localToIsoUtc. Movements come from real instants through the client's
// isoUtcToLocal, half of them close to a DST change, so the repeated hour in
// October and the skipped hour in March are covered. The engine breaks ties
// in de-CH, the client in the default locale; where those differ, skip.
const {compareAscending, REGISTRATION_LOCALE} = require('../../../functions/reports/airstat/movements');
const {mulberry32} = require('../../../functions/reports/airstat/testing/mulberry32');
const clientMovements = require('../movements');
const dates = require('../dates').default;

const SEED = 20261003;
const PAIRS = 10000;
const REGISTRATIONS = ['HBKOF', 'HBKOF', 'HBXAB', 'hbkof', 'HB-KOF', 'DEABC', '', undefined];

// Last Sunday of March and October at 01:00 UTC.
function dstChanges(fromYear, toYear) {
  const changes = [];
  for (let year = fromYear; year <= toYear; year++) {
    for (const month of [3, 10]) {
      const lastDay = new Date(Date.UTC(year, month, 0));
      changes.push(Date.UTC(year, month - 1, lastDay.getUTCDate() - lastDay.getUTCDay(), 1));
    }
  }
  return changes;
}

const sameTieOrder = REGISTRATIONS.filter(Boolean).concat('HBAAA', 'HBZZZ').every((a, i, all) => all.every(b =>
  Math.sign(a.localeCompare(b)) === Math.sign(new Intl.Collator(REGISTRATION_LOCALE).compare(a, b))));

describe('util', () => {
  (sameTieOrder ? describe : describe.skip)('airstatOracles/movements', () => {
    it(`compareAscending orders ${PAIRS} pairs like the client (seed ${SEED})`, () => {
      const random = mulberry32(SEED);
      const changes = dstChanges(2000, 2099);
      const pick = list => list[Math.floor(random() * list.length)];
      const randomMovement = () => {
        const instant = random() < 0.5
          ? pick(changes) + Math.floor((random() - 0.5) * 4 * 3600 * 1000)
          : Date.UTC(2000, 0, 1) + Math.floor(random() * 100 * 365.25 * 24 * 3600 * 1000);
        return {...dates.isoUtcToLocal(new Date(instant).toISOString()), immatriculation: pick(REGISTRATIONS)};
      };

      const mismatches = [];
      let ties = 0;
      for (let i = 0; i < PAIRS; i++) {
        const a = randomMovement();
        // Every fourth pair shares the minute, so registration ties are exercised.
        const b = i % 4 === 0 ? {...a, immatriculation: pick(REGISTRATIONS)} : randomMovement();
        const expected = Math.sign(clientMovements.compareAscending(a, b));
        const actual = Math.sign(compareAscending(a, b));
        if (expected === 0) {
          ties++;
        }
        if (actual !== expected && mismatches.length < 10) {
          mismatches.push({a, b, expected, actual});
        }
      }

      expect(mismatches).toEqual([]);
      expect(ties).toBeGreaterThan(PAIRS / 40);
    });
  });
});
