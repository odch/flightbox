const { binarySearch, createItemsArray } = require('./sortedInsert');

const byValue = (a, b) => a.v - b.v;
const keysOf = items => items.array.map(item => item.key);

describe('functions', () => {
  describe('reports/airstat/sortedInsert', () => {
    describe('binarySearch', () => {
      it('returns the index of the first probed equal element', () => {
        const haystack = [1, 2, 2, 2, 3].map(v => ({ v }));
        expect(binarySearch(haystack, { v: 2 }, byValue)).toBe(2);
      });

      it('returns ~low when the needle is missing', () => {
        const haystack = [1, 3, 5].map(v => ({ v }));
        expect(binarySearch(haystack, { v: 0 }, byValue)).toBe(~0);
        expect(binarySearch(haystack, { v: 4 }, byValue)).toBe(~2);
        expect(binarySearch(haystack, { v: 6 }, byValue)).toBe(~3);
        expect(binarySearch([], { v: 1 }, byValue)).toBe(~0);
      });

      it('treats a NaN comparison as a match, like binary-search', () => {
        const haystack = [0, 1, 2, 3].map(v => ({ v }));
        const comparator = (a, b) => (a.v === 1 ? NaN : a.v - b.v);
        expect(binarySearch(haystack, { v: 3 }, comparator)).toBe(1);
      });

      it('passes the client comparator arguments', () => {
        const haystack = [{ v: 1 }];
        const needle = { v: 1 };
        const comparator = jest.fn(() => 0);
        binarySearch(haystack, needle, comparator);
        expect(comparator).toHaveBeenCalledWith(haystack[0], needle, 0, haystack);
      });
    });

    describe('createItemsArray', () => {
      it('keeps the array sorted', () => {
        const items = createItemsArray(byValue);
        [5, 1, 4, 2, 3].forEach((v, i) => items.insert({ key: `k${i}`, v }));
        expect(items.array.map(item => item.v)).toEqual([1, 2, 3, 4, 5]);
      });

      it('orders ties like the client (first probed tie wins)', () => {
        const items = createItemsArray(byValue);
        ['k0', 'k1', 'k2', 'k3', 'k4'].forEach(key => items.insert({ key, v: 1 }));
        expect(keysOf(items)).toEqual(['k2', 'k4', 'k3', 'k1', 'k0']);
      });

      it('orders ties between other values like the client', () => {
        const items = createItemsArray(byValue);
        items.insert({ key: 'low', v: 0 });
        items.insert({ key: 'high', v: 2 });
        ['t0', 't1', 't2', 't3'].forEach(key => items.insert({ key, v: 1 }));
        expect(keysOf(items)).toEqual(['low', 't2', 't3', 't1', 't0', 'high']);
      });

      it('returns false for a duplicate key and leaves the array unchanged', () => {
        const items = createItemsArray(byValue);
        const first = { key: 'a', v: 2 };
        expect(items.insert(first)).toBe(true);
        expect(items.insert({ key: 'b', v: 1 })).toBe(true);
        expect(items.insert({ key: 'a', v: 0 })).toBe(false);
        expect(keysOf(items)).toEqual(['b', 'a']);
        expect(items.array[1]).toBe(first);
      });

      it('treats a number key and its string as the same key', () => {
        const items = createItemsArray(byValue);
        expect(items.insert({ key: 1, v: 1 })).toBe(true);
        expect(items.insert({ key: '1', v: 1 })).toBe(false);
        expect(items.array).toHaveLength(1);
      });

      it.each([undefined, null, '', 0, false, NaN])('throws for key %p', key => {
        const items = createItemsArray(byValue);
        expect(() => items.insert({ key, v: 1 })).toThrow(new Error('Property "key" is missing'));
        expect(items.array).toEqual([]);
      });

      it.each(['constructor', '__proto__', 'toString', 'hasOwnProperty'])(
        'never inserts the inherited key %j, like the client',
        key => {
          const items = createItemsArray(byValue);
          expect(items.insert({ key, v: 1 })).toBe(false);
          expect(items.array).toEqual([]);
        }
      );

      it('does not compare an item whose key is already present', () => {
        const comparator = jest.fn(byValue);
        const items = createItemsArray(comparator);
        items.insert({ key: 'a', v: 1 });
        items.insert({ key: 'b', v: 2 });
        comparator.mockClear();
        items.insert({ key: 'a', v: 3 });
        expect(comparator).not.toHaveBeenCalled();
      });

      it('marks the key before comparing, like the client', () => {
        // compareAscending throws on a tie with a numeric immatriculation
        const comparator = (a, b) => a.v - b.v || a.reg.localeCompare(b.reg);
        const items = createItemsArray(comparator);
        items.insert({ key: 'a', v: 1, reg: 42 });
        expect(() => items.insert({ key: 'b', v: 1, reg: 'HBABC' })).toThrow(TypeError);
        expect(items.insert({ key: 'b', v: 2, reg: 'HBABC' })).toBe(false);
        expect(keysOf(items)).toEqual(['a']);
      });
    });
  });
});
