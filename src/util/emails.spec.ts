import {isValidEmail, MAX_EMAIL_LENGTH, normalizeEmail} from './emails';

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
  });
});
