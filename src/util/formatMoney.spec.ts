import formatMoney from './formatMoney';

describe('util', () => {
  describe('formatMoney', () => {
    it('returns 2 decimal places for integers', () => {
      expect(formatMoney(10)).toBe('10.00');
    });

    it('returns 2 decimal places for floats with 1 decimal', () => {
      expect(formatMoney(10.5)).toBe('10.50');
    });

    it('returns 2 decimal places for floats with 2 decimals', () => {
      expect(formatMoney(10.25)).toBe('10.25');
    });

    it('rounds to 2 decimal places', () => {
      expect(formatMoney(10.125)).toBe('10.13');
    });

    it('handles negative values', () => {
      expect(formatMoney(-5.5)).toBe('-5.50');
    });

    it('handles zero', () => {
      expect(formatMoney(0)).toBe('0.00');
    });

    it('handles large numbers', () => {
      expect(formatMoney(1234.56)).toBe('1234.56');
    });
  });
});
