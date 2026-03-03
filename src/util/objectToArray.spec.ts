import objectToArray from './objectToArray';

describe('util', () => {
  describe('objectToArray', () => {
    it('converts object with numeric keys to sorted array', () => {
      const obj = { 2: 'bar', 0: 'foo', 1: 'baz' };
      expect(objectToArray(obj)).toEqual(['foo', 'baz', 'bar']);
    });

    it('returns empty array for empty object', () => {
      expect(objectToArray({})).toEqual([]);
    });

    it('returns single-element array for single-key object', () => {
      expect(objectToArray({ 0: 'only' })).toEqual(['only']);
    });

    it('preserves values (not keys)', () => {
      const obj = { a: 'first', b: 'second' };
      const result = objectToArray(obj);
      expect(result).toContain('first');
      expect(result).toContain('second');
    });
  });
});
