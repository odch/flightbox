'use strict';

const { normalizeValue, isPlainObject } = require('./normalize');

describe('movement domain', () => {
  describe('normalizeValue', () => {
    it.each([
      ['null', null, null],
      ['undefined', undefined, null],
      ['an empty object', {}, null],
      ['an empty list', [], null],
      ['an object of nulls', { a: null, b: {} }, null],
      ['a string', 'x', 'x'],
      ['an empty string', '', ''],
      ['zero', 0, 0],
      ['false', false, false],
      ['a list', ['a', null, 'c'], { 0: 'a', 2: 'c' }],
      ['a nested object', { method: 'cash', extra: { gone: null }, keep: [1] }, { method: 'cash', keep: { 0: 1 } }],
    ])('stores %s like the Realtime Database', (label, value, expected) => {
      expect(normalizeValue(value)).toEqual(expected);
    });

    it('keeps an own "__proto__" key as data instead of setting the prototype', () => {
      const normalized = normalizeValue(JSON.parse('{"a":1,"__proto__":{"method":"cash"}}'));
      expect(Object.getPrototypeOf(normalized)).toBe(Object.prototype);
      expect(Object.keys(normalized)).toEqual(['a', '__proto__']);
      expect(Object.prototype.hasOwnProperty.call(normalized, 'method')).toBe(false);
      expect(normalized.method).toBeUndefined();
    });

    it('does not mutate its input', () => {
      const value = { a: null, b: { c: null, d: 1 } };
      normalizeValue(value);
      expect(value).toEqual({ a: null, b: { c: null, d: 1 } });
    });
  });

  describe('isPlainObject', () => {
    it('accepts objects only', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject('x')).toBe(false);
    });
  });
});
