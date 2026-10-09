import {isValidEmail, MAX_EMAIL_LENGTH, normalizeEmail, normalizeEmailList} from './emails';

describe('util', () => {
  describe('emails', () => {
    describe('normalizeEmail', () => {
      it('trims and lower-cases', () => {
        expect(normalizeEmail('  Hans.Muster@Example.CH ')).toBe('hans.muster@example.ch');
      });
    });

    describe('isValidEmail', () => {
      it.each([
        'hans@example.ch',
        'hans.muster+customs@sub.example.com',
        'a@b.co',
      ])('accepts %s', email => {
        expect(isValidEmail(email)).toBe(true);
      });

      it.each([
        '',
        'hans',
        'hans@',
        '@example.ch',
        'hans@example',
        'hans muster@example.ch',
        'hans@exa mple.ch',
        'hans@@example.ch',
        'hans@example.ch\t',
      ])('rejects %p', email => {
        expect(isValidEmail(email)).toBe(false);
      });

      it('rejects addresses longer than the maximum length', () => {
        const domain = '@example.ch';
        const longest = 'a'.repeat(MAX_EMAIL_LENGTH - domain.length) + domain;
        expect(isValidEmail(longest)).toBe(true);
        expect(isValidEmail('a' + longest)).toBe(false);
      });
    });

    describe('normalizeEmailList', () => {
      it('returns an empty list for missing values', () => {
        expect(normalizeEmailList(null)).toEqual([]);
        expect(normalizeEmailList(undefined)).toEqual([]);
        expect(normalizeEmailList('a@example.ch')).toEqual([]);
      });

      it('normalises the entries and removes duplicates', () => {
        expect(normalizeEmailList(['a@example.ch', ' B@Example.ch', 'A@example.ch'])).toEqual([
          'a@example.ch',
          'b@example.ch',
        ]);
      });

      it('drops entries that are not non-empty strings', () => {
        expect(normalizeEmailList(['a@example.ch', 42, null, {}, '  '])).toEqual(['a@example.ch']);
      });

      it('accepts a sparse list stored as an object', () => {
        expect(normalizeEmailList({0: 'a@example.ch', 3: 'b@example.ch'})).toEqual([
          'a@example.ch',
          'b@example.ch',
        ]);
      });
    });
  });
});
