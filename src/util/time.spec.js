import expect from 'expect';
import { normalize, parse } from './time';

describe('time', () => {
  describe('normalize', () => {
    it('normalizes hours', () => {
      const time = {
        hours: 26,
        minutes: 10,
      };

      const normalized = normalize(time);

      expect(normalized.hours).toBe(2);
      expect(normalized.minutes).toBe(10);
    });

    it('wraps 24 hours to 0', () => {
      const time = {
        hours: 24,
        minutes: 10,
      };

      const normalized = normalize(time);

      expect(normalized.hours).toBe(0);
      expect(normalized.minutes).toBe(10);
    });

    it('normalizes minutes', () => {
      const time = {
        hours: 10,
        minutes: 75,
      };

      const normalized = normalize(time);

      expect(normalized.hours).toBe(11);
      expect(normalized.minutes).toBe(15);
    });

    it('wraps 60 minutes to 0', () => {
      const time = {
        hours: 10,
        minutes: 60,
      };

      const normalized = normalize(time);

      expect(normalized.hours).toBe(11);
      expect(normalized.minutes).toBe(0);
    });

    it('wraps minutes and hours', () => {
      const time = {
        hours: 23,
        minutes: 60,
      };

      const normalized = normalize(time);

      expect(normalized.hours).toBe(0);
      expect(normalized.minutes).toBe(0);
    });

    it('wraps negative minutes', () => {
      const time = {
        hours: 10,
        minutes: -1,
      };

      const normalized = normalize(time);

      expect(normalized.hours).toBe(9);
      expect(normalized.minutes).toBe(59);
    });

    it('wraps negative minutes across multiple hours', () => {
      const time = {
        hours: 10,
        minutes: -61,
      };

      const normalized = normalize(time);

      expect(normalized.hours).toBe(8);
      expect(normalized.minutes).toBe(59);
    });

    it('wraps negative hours', () => {
      const time = {
        hours: -1,
        minutes: 0,
      };

      const normalized = normalize(time);

      expect(normalized.hours).toBe(23);
      expect(normalized.minutes).toBe(0);
    });
  });

  describe('parse', () => {
    it('returns null for invalid value', () => {
      const parsed = parse('foo');

      expect(parsed).toBe(null);
    });

    it('parses valid value', () => {
      const parsed = parse('14:16');

      expect(parsed.hours).toBe(14);
      expect(parsed.minutes).toBe(16);
    });

    it('normalizes time', () => {
      const parsed = parse('27:78');

      expect(parsed.hours).toBe(4);
      expect(parsed.minutes).toBe(18);
    });
  });
});
