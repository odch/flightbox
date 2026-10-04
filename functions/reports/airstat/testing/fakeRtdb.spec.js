'use strict';

const { createFakeRtdb } = require('./fakeRtdb');

const keysOf = snapshot => {
  const keys = [];
  snapshot.forEach(child => {
    keys.push(child.key);
  });
  return keys;
};

describe('functions', () => {
  describe('reports/airstat/testing/fakeRtdb', () => {
    const db = createFakeRtdb({
      list: {
        b: { t: '2026-10-02' },
        a: { t: '2026-10-02' },
        c: { t: '2026-10-01' },
        d: { t: 5 },
        e: {},
        f: { t: '2026-11-01' },
        g: { t: '2026-10-31' },
        10: { t: '2026-10-03' },
        9: { t: '2026-10-03' },
      },
    });

    it('orders a query by the child value, then by key, within the bounds', async () => {
      const snapshot = await db.ref('/list').orderByChild('t').startAt('2026-10-01').endAt('2026-10-31').once('value');
      expect(keysOf(snapshot)).toEqual(['c', 'a', 'b', '9', '10', 'g']);
      expect(() => snapshot.val()).toThrow('forEach');
    });

    it('orders plain reads by key, integer keys first', async () => {
      const snapshot = await db.ref('/list').once('value');
      expect(keysOf(snapshot)).toEqual(['9', '10', 'a', 'b', 'c', 'd', 'e', 'f', 'g']);
      expect(snapshot.val().c).toEqual({ t: '2026-10-01' });
      expect((await db.ref('/missing/path').once('value')).val()).toBe(null);
    });

    it('stops forEach at a truthy return, like the SDK', async () => {
      const snapshot = await db.ref('/list').once('value');
      const seen = [];
      expect(snapshot.forEach(child => seen.push(child.key))).toBe(true);
      expect(seen).toEqual(['9']);
    });
  });
});
