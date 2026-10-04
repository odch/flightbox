const { getFromItemKey } = require('./referenceNumber');

describe('functions', () => {
  describe('reports/airstat/referenceNumber', () => {
    describe('getFromItemKey', () => {
      it.each([
        ['key-abc1', 'ABC1'],
        ['-KG7OujLL5ti7yrhmwr7', 'MWR7'],
        ['-NabcDEF123_x-Yz', '3XYZ'],
        ['-NabcDEF123_x-Yz_circuits', 'UITS'],
        ['abc-d', 'ABCD'],
        ['ab_c-d', 'ABCD'],
        ['abcd_', 'ABCD'],
        ['abcd-_-', 'ABCD'],
        ['a-b_c-d-e', 'BCDE'],
        ['xyz9', 'XYZ9'],
        ['abc', 'ABC'],
        ['a', 'A'],
        ['a_b', 'AB'],
        ['', ''],
        ['-', ''],
        ['-_-_', ''],
        ['0000', '0000'],
      ])('maps %j to %j', (key, expected) => {
        expect(getFromItemKey(key)).toBe(expected);
      });

      it('upper-cases only the kept characters', () => {
        expect(getFromItemKey('lowercase')).toBe('CASE');
        expect(getFromItemKey('MiXeD')).toBe('IXED');
      });

      // The client class has no i or u flag, so letters that case-fold to
      // ASCII (long s, Kelvin sign) and non-ASCII digits are skipped too.
      it.each([
        ['éabcé', 'ABC'],
        ['abécd', 'ABCD'],
        ['abcſ', 'ABC'],
        ['abcK', 'ABC'],
        ['abcß', 'ABC'],
        ['ab١٢', 'AB'],
        ['ＡＢ12', '12'],
        ['ab😀cd', 'ABCD'],
        ['ab\uD800', 'AB'],
      ])('skips non-ASCII code units in %j', (key, expected) => {
        expect(getFromItemKey(key)).toBe(expected);
      });

      it('throws like the client when the key is missing', () => {
        expect(() => getFromItemKey(undefined)).toThrow(TypeError);
        expect(() => getFromItemKey(null)).toThrow(TypeError);
      });
    });
  });
});
