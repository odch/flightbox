import Predicates from './Predicates.js';

describe('components', () => {
  describe('MovementList', () => {
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

        it('returns true if delegate returns false', () => {
          const delegate = (arg) => arg === 'bar';
          const resultDelegate = delegate('foo');
          const resultNot = Predicates.not(delegate)('foo');
          expect(resultDelegate).toBe(false);
          expect(resultNot).toBe(true);
        });
      });

      describe('same day', () => {
        it('returns true if same day', () => {
          const result = Predicates.sameDay('2016-01-01')({
            date: '2016-01-01',
          });
          expect(result).toBe(true);
        });

        it('returns false if day before', () => {
          const result = Predicates.sameDay('2015-12-31')({
            date: '2016-01-01',
          });
          expect(result).toBe(false);
        });

        it('returns false if day after', () => {
          const result = Predicates.sameDay('2016-01-02')({
            date: '2016-01-01',
          });
          expect(result).toBe(false);
        });

        it('returns false if same day one year before', () => {
          const result = Predicates.sameDay('2015-01-01')({
            date: '2016-01-01',
          });
          expect(result).toBe(false);
        });
      });

      describe('older than same day', () => {
        it('returns true if day before', () => {
          const result = Predicates.olderThanSameDay('2016-04-10')({
            date: '2016-04-09',
          });
          expect(result).toBe(true);
        });

        it('returns true if two days before', () => {
          const result = Predicates.olderThanSameDay('2016-04-10')({
            date: '2016-04-08',
          });
          expect(result).toBe(true);
        });

        it('returns true if same day one year before', () => {
          const result = Predicates.olderThanSameDay('2016-04-10')({
            date: '2015-04-10',
          });
          expect(result).toBe(true);
        });

        it('returns false if same day', () => {
          const result = Predicates.olderThanSameDay('2016-04-10')({
            date: '2016-04-10',
          });
          expect(result).toBe(false);
        });

        it('returns false if day after', () => {
          const result = Predicates.olderThanSameDay('2016-04-10')({
            date: '2016-04-11',
          });
          expect(result).toBe(false);
        });
      });

      describe('day before', () => {
        it('returns true if day before', () => {
          const result = Predicates.dayBefore('2016-01-01')({
            date: '2015-12-31',
          });
          expect(result).toBe(true);
        });

        it('returns false if day before the day before', () => {
          const result = Predicates.dayBefore('2016-01-01')({
            date: '2015-12-30',
          });
          expect(result).toBe(false);
        });

        it('returns false if same day', () => {
          const result = Predicates.dayBefore('2016-01-01')({
            date: '2016-01-01',
          });
          expect(result).toBe(false);
        });

        it('returns false if day before one year before', () => {
          const result = Predicates.dayBefore('2015-01-01')({
            date: '2015-12-31',
          });
          expect(result).toBe(false);
        });
      });

      describe('same month', () => {
        it('returns true if same day', () => {
          const result = Predicates.sameMonth('2016-01-10')({
            date: '2016-01-10',
          });
          expect(result).toBe(true);
        });

        it('returns true if same month after same day', () => {
          const result = Predicates.sameMonth('2016-01-10')({
            date: '2016-01-15',
          });
          expect(result).toBe(true);
        });

        it('returns true if same month before same day', () => {
          const result = Predicates.sameMonth('2016-01-10')({
            date: '2016-01-05',
          });
          expect(result).toBe(true);
        });

        it('returns false if before same month', () => {
          const result = Predicates.sameMonth('2016-01-10')({
            date: '2015-12-31',
          });
          expect(result).toBe(false);
        });

        it('returns false if after same month', () => {
          const result = Predicates.sameMonth('2016-01-10')({
            date: '2016-02-01',
          });
          expect(result).toBe(false);
        });

        it('returns false if same month one year before', () => {
          const result = Predicates.sameMonth('2016-01-10')({
            date: '2016-02-01',
          });
          expect(result).toBe(false);
        });
      });

      describe('older than same month', () => {
        it('returns true if month before', () => {
          const result = Predicates.olderThanSameMonth('2016-04-10')({
            date: '2016-03-31',
          });
          expect(result).toBe(true);
        });

        it('returns true if two months before', () => {
          const result = Predicates.olderThanSameMonth('2016-04-10')({
            date: '2016-02-15',
          });
          expect(result).toBe(true);
        });

        it('returns true if same month one year before', () => {
          const result = Predicates.olderThanSameMonth('2016-04-10')({
            date: '2015-04-15',
          });
          expect(result).toBe(true);
        });

        it('returns false if same month', () => {
          const result = Predicates.olderThanSameMonth('2016-04-10')({
            date: '2016-04-05',
          });
          expect(result).toBe(false);
        });

        it('returns false if month after', () => {
          const result = Predicates.olderThanSameMonth('2016-04-10')({
            date: '2016-05-01',
          });
          expect(result).toBe(false);
        });
      });
    });
  });
});
