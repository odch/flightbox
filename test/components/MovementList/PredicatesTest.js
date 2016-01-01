import expect from 'expect';
import Predicates from '../../../src/components/MovementList/Predicates.js';

describe('Predicates', () => {
  describe('and', () => {
    it('empty evaluates to true', () => {
      const result = Predicates.and()('foo');
      expect(result).toBe(true);
    });

    it('evaluates to true (one predicate)', () => {
      const result = Predicates.and((arg) => arg === 'foo')('foo');
      expect(result).toBe(true);
    });

    it('evaluates to false (one predicate)', () => {
      const result = Predicates.and((arg) => arg === 'bar')('foo');
      expect(result).toBe(false);
    });

    it('evaluates to true (multiple predicates)', () => {
      const result = Predicates.and(
        (arg) => arg === 'foo', // true
        (arg) => arg.length === 3 // true
      )('foo');
      expect(result).toBe(true);
    });

    it('evaluates to false (multiple predicates)', () => {
      const result = Predicates.and(
        (arg) => arg === 'foo', // true
        (arg) => arg.length === 100 // false
      )('foo');
      expect(result).toBe(false);
    });

    it('exits on first failing predicate', () => {
      const result = Predicates.and(
        (arg) => arg === 'bar', // false
        () => { throw new Error('must not be reached'); }
      )('foo');
      expect(result).toBe(false);
    });
  });

  describe('not', () => {
    it('returns false if delegate returns true', () => {
      const delegate = (arg) => arg === 'foo';
      const resultDelegate = delegate('foo');
      const resultNot = Predicates.not(delegate)('foo');
      expect(resultDelegate).toBe(true);
      expect(resultNot).toBe(false);
    });
  });

  describe('not', () => {
    it('returns true if delegate returns false', () => {
      const delegate = (arg) => arg === 'bar';
      const resultDelegate = delegate('foo');
      const resultNot = Predicates.not(delegate)('foo');
      expect(resultDelegate).toBe(false);
      expect(resultNot).toBe(true);
    });
  });
});
