import {isValidRegistration, normalizeRegistration, normalizeSelfDeclarants} from './selfDeclarants';

describe('util', () => {
  describe('selfDeclarants', () => {
    describe('normalizeRegistration', () => {
      it.each([
        'hb-kla',
        'HB-KLA',
        'HB KLA',
        'HBKLA',
        ' hb.kla ',
      ])('normalises %p to HBKLA', value => {
        expect(normalizeRegistration(value)).toBe('HBKLA');
      });

      it('keeps digits', () => {
        expect(normalizeRegistration('d-9876')).toBe('D9876');
      });

      it('returns an empty string when nothing is left', () => {
        expect(normalizeRegistration(' - ')).toBe('');
      });
    });

    describe('isValidRegistration', () => {
      it.each(['A', 'HBKLA', 'N12345', 'ABCDEFGHIJ'])('accepts %p', value => {
        expect(isValidRegistration(value)).toBe(true);
      });

      it.each(['', 'ABCDEFGHIJK', 'HB-KLA', 'hbkla', 'HB KLA'])('rejects %p', value => {
        expect(isValidRegistration(value)).toBe(false);
      });
    });

    describe('normalizeSelfDeclarants', () => {
      it('returns an empty list for missing values', () => {
        expect(normalizeSelfDeclarants(null)).toEqual([]);
        expect(normalizeSelfDeclarants(undefined)).toEqual([]);
        expect(normalizeSelfDeclarants('a@example.ch')).toEqual([]);
      });

      it('normalises the e-mails and registrations', () => {
        expect(normalizeSelfDeclarants([
          {email: ' Hans@Example.CH ', registrations: ['hb-kla', 'HB KLB']},
        ])).toEqual([
          {email: 'hans@example.ch', registrations: ['HBKLA', 'HBKLB']},
        ]);
      });

      it('reads a missing list of registrations as no aircraft', () => {
        expect(normalizeSelfDeclarants([{email: 'a@example.ch'}])).toEqual([
          {email: 'a@example.ch', registrations: []},
        ]);
      });

      it('reads legacy plain e-mail entries as persons without aircraft', () => {
        expect(normalizeSelfDeclarants(['a@example.ch', ' B@Example.ch'])).toEqual([
          {email: 'a@example.ch', registrations: []},
          {email: 'b@example.ch', registrations: []},
        ]);
      });

      it('merges duplicate e-mails, keeping the aircraft of both', () => {
        expect(normalizeSelfDeclarants([
          {email: 'a@example.ch', registrations: ['HBKLA']},
          'A@example.ch',
          {email: 'a@example.ch ', registrations: ['hb-kla', 'HBKLB']},
        ])).toEqual([
          {email: 'a@example.ch', registrations: ['HBKLA', 'HBKLB']},
        ]);
      });

      it('drops duplicate, empty, too long and non-string registrations', () => {
        expect(normalizeSelfDeclarants([
          {email: 'a@example.ch', registrations: ['HBKLA', 'hb-kla', '--', 'ABCDEFGHIJK', 42, null]},
        ])).toEqual([
          {email: 'a@example.ch', registrations: ['HBKLA']},
        ]);
      });

      it('ignores registrations that are not a list', () => {
        expect(normalizeSelfDeclarants([{email: 'a@example.ch', registrations: 'HBKLA'}])).toEqual([
          {email: 'a@example.ch', registrations: []},
        ]);
      });

      it('drops entries without a non-empty e-mail', () => {
        expect(normalizeSelfDeclarants([
          'a@example.ch',
          42,
          null,
          {},
          {email: 42, registrations: ['HBKLA']},
          {registrations: ['HBKLA']},
          '  ',
          {email: ' ', registrations: ['HBKLA']},
        ])).toEqual([
          {email: 'a@example.ch', registrations: []},
        ]);
      });

      it('accepts sparse lists stored as objects', () => {
        expect(normalizeSelfDeclarants({
          0: {email: 'a@example.ch', registrations: {1: 'HBKLA'}},
          3: 'b@example.ch',
        })).toEqual([
          {email: 'a@example.ch', registrations: ['HBKLA']},
          {email: 'b@example.ch', registrations: []},
        ]);
      });
    });
  });
});
