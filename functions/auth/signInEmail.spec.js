const { normalizeEmail } = require('./signInEmail');

describe('functions', () => {
  describe('auth/signInEmail', () => {
    describe('normalizeEmail', () => {
      it('trims and lower-cases a valid address', () => {
        expect(normalizeEmail('  Pilot.One+Tag@Example.CH ')).toBe('pilot.one+tag@example.ch');
      });

      it('accepts subdomains', () => {
        expect(normalizeEmail('a@mail.example.co.uk')).toBe('a@mail.example.co.uk');
      });

      it.each([
        [undefined],
        [null],
        [42],
        [['a@example.com']],
        [{ email: 'a@example.com' }],
      ])('rejects the non-string %p', (value) => {
        expect(normalizeEmail(value)).toBeNull();
      });

      it.each([
        [''],
        ['not-an-email'],
        ['a@example'],
        ['a@example.c'],
        ['a@@example.com'],
        ['a b@example.com'],
        ['a1,victim@example.com'],
        ['"x",victim@example.com'],
        ['<victim@example.com>'],
        ['victim@example.com\nbcc@example.com'],
        ['jörg@example.ch'],
        ['a@[1.2.3.4]'],
      ])('rejects %p', (value) => {
        expect(normalizeEmail(value)).toBeNull();
      });

      it('rejects addresses longer than 254 characters', () => {
        const local = 'a'.repeat(64);
        const domain = `${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(58)}.ch`;
        expect(`${local}@${domain}`.length).toBe(254);
        expect(normalizeEmail(`${local}@${domain}`)).not.toBeNull();
        expect(normalizeEmail(`${local}a@${domain}`)).toBeNull();
      });

      it('rejects a huge input quickly', () => {
        const start = Date.now();
        expect(normalizeEmail('a@'.repeat(100000))).toBeNull();
        expect(normalizeEmail(`${'a'.repeat(100000)}@example.com`)).toBeNull();
        expect(Date.now() - start).toBeLessThan(100);
      });
    });
  });
});
