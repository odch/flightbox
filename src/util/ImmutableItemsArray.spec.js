import ImmutableItemsArray from './ImmutableItemsArray';

const byKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;

describe('util', () => {
  describe('ImmutableItemsArray', () => {
    describe('constructor', () => {
      it('creates empty array when no argument given', () => {
        const arr = new ImmutableItemsArray();
        expect(arr.array).toHaveLength(0);
        expect(arr.keys).toEqual({});
      });

      it('initializes from array and builds key index', () => {
        const items = [{key: 'a'}, {key: 'b'}];
        const arr = new ImmutableItemsArray(items);
        expect(arr.array).toHaveLength(2);
        expect(arr.keys['a']).toBe(0);
        expect(arr.keys['b']).toBe(1);
      });
    });

    describe('containsKey', () => {
      it('returns true when key exists', () => {
        const arr = new ImmutableItemsArray([{key: 'x'}]);
        expect(arr.containsKey('x')).toBe(true);
      });

      it('returns false when key does not exist', () => {
        const arr = new ImmutableItemsArray([{key: 'x'}]);
        expect(arr.containsKey('z')).toBe(false);
      });
    });

    describe('getByKey', () => {
      it('returns item when key exists', () => {
        const item = {key: 'a', value: 1};
        const arr = new ImmutableItemsArray([item]);
        expect(arr.getByKey('a')).toEqual(item);
      });

      it('returns null when key does not exist', () => {
        const arr = new ImmutableItemsArray([{key: 'a'}]);
        expect(arr.getByKey('missing')).toBeNull();
      });
    });

    describe('insert', () => {
      it('inserts new item and maintains order', () => {
        const arr = new ImmutableItemsArray([{key: 'a'}, {key: 'c'}]);
        const result = arr.insert({key: 'b'}, byKey);
        expect(result.array.map(i => i.key)).toEqual(['a', 'b', 'c']);
      });

      it('returns self when key already exists (does not duplicate)', () => {
        const arr = new ImmutableItemsArray([{key: 'a'}, {key: 'b'}]);
        const result = arr.insert({key: 'a'}, byKey);
        expect(result).toBe(arr);
        expect(result.array).toHaveLength(2);
      });

      it('throws error if item has no key property', () => {
        const arr = new ImmutableItemsArray([]);
        expect(() => arr.insert({value: 1}, byKey)).toThrow('Property "key" is missing');
      });

      it('returns new ImmutableItemsArray instance on success', () => {
        const arr = new ImmutableItemsArray([{key: 'a'}]);
        const result = arr.insert({key: 'b'}, byKey);
        expect(result).not.toBe(arr);
        expect(result).toBeInstanceOf(ImmutableItemsArray);
      });
    });

    describe('update', () => {
      it('updates existing item and reorders', () => {
        const arr = new ImmutableItemsArray([{key: 'a', v: 1}, {key: 'b', v: 2}, {key: 'c', v: 3}]);
        const result = arr.update({key: 'a', v: 99}, byKey);
        expect(result.array.map(i => i.key)).toEqual(['a', 'b', 'c']);
        expect(result.getByKey('a').v).toBe(99);
      });

      it('returns self when key does not exist', () => {
        const arr = new ImmutableItemsArray([{key: 'a'}]);
        const result = arr.update({key: 'unknown'}, byKey);
        expect(result).toBe(arr);
      });

      it('throws error if item has no key', () => {
        const arr = new ImmutableItemsArray([{key: 'a'}]);
        expect(() => arr.update({value: 1}, byKey)).toThrow('Property "key" is missing');
      });
    });

    describe('remove', () => {
      it('removes existing item by key', () => {
        const arr = new ImmutableItemsArray([{key: 'a'}, {key: 'b'}, {key: 'c'}]);
        const result = arr.remove('b');
        expect(result.array.map(i => i.key)).toEqual(['a', 'c']);
        expect(result.containsKey('b')).toBe(false);
      });

      it('returns self when key does not exist', () => {
        const arr = new ImmutableItemsArray([{key: 'a'}]);
        const result = arr.remove('nonexistent');
        expect(result).toBe(arr);
      });

      it('returns new ImmutableItemsArray on successful removal', () => {
        const arr = new ImmutableItemsArray([{key: 'a'}, {key: 'b'}]);
        const result = arr.remove('a');
        expect(result).not.toBe(arr);
        expect(result).toBeInstanceOf(ImmutableItemsArray);
      });
    });

    describe('insertAll', () => {
      it('inserts all new items without comparator (appends)', () => {
        const arr = new ImmutableItemsArray([{key: 'a'}]);
        const result = arr.insertAll([{key: 'b'}, {key: 'c'}]);
        expect(result.array).toHaveLength(3);
        expect(result.containsKey('b')).toBe(true);
        expect(result.containsKey('c')).toBe(true);
      });

      it('inserts all new items with comparator (ordered)', () => {
        const arr = new ImmutableItemsArray([{key: 'a'}, {key: 'c'}]);
        const result = arr.insertAll([{key: 'b'}], byKey);
        expect(result.array.map(i => i.key)).toEqual(['a', 'b', 'c']);
      });

      it('skips items whose keys already exist', () => {
        const arr = new ImmutableItemsArray([{key: 'a'}, {key: 'b'}]);
        const result = arr.insertAll([{key: 'a'}, {key: 'c'}]);
        expect(result.array).toHaveLength(3);
        expect(result.containsKey('c')).toBe(true);
      });

      it('throws error if any item is missing key', () => {
        const arr = new ImmutableItemsArray([]);
        expect(() => arr.insertAll([{value: 1}])).toThrow('Property "key" is missing');
      });

      it('returns new ImmutableItemsArray', () => {
        const arr = new ImmutableItemsArray([{key: 'a'}]);
        const result = arr.insertAll([{key: 'b'}]);
        expect(result).toBeInstanceOf(ImmutableItemsArray);
      });
    });
  });
});
