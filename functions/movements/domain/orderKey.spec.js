'use strict';

const { toOrderKey } = require('./orderKey');

describe('movement domain', () => {
  describe('toOrderKey', () => {
    it('prefixes the inverted timestamp with the owner', () => {
      expect(toOrderKey('pilot@example.com', -1476021600000)).toBe('pilot@example.com_8523978399999');
    });

    it('sorts newer movements of an owner first', () => {
      const older = toOrderKey('a@b.ch', -Date.parse('2026-06-16T10:00:00.000Z'));
      const newer = toOrderKey('a@b.ch', -Date.parse('2026-06-17T10:00:00.000Z'));
      expect(newer < older).toBe(true);
    });
  });
});
