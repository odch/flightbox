import validate, { validateWithoutLogin } from './validate';
import i18n from '../../i18n';

const TODAY = '2026-11-13';

const valid = {
  firstname: 'Max',
  lastname: 'Muster',
  immatriculation: 'HB-ABC',
  aircraftCategory: 'Flugzeug',
  plannedDate: '2026-11-20',
  plannedTime: '10:30',
  flightType: 'private',
};

describe('components', () => {
  describe('PprRequestForm', () => {
    describe('validate', () => {
      it('returns errors for all missing required fields', () => {
        const errors = validate({}, TODAY);
        expect(Object.keys(errors)).toContain('firstname');
        expect(Object.keys(errors)).toContain('lastname');
        expect(Object.keys(errors)).toContain('immatriculation');
        expect(Object.keys(errors)).toContain('aircraftCategory');
        expect(Object.keys(errors)).toContain('plannedDate');
        expect(Object.keys(errors)).toContain('plannedTime');
        expect(Object.keys(errors)).toContain('flightType');
      });

      it('returns no errors when all required fields are valid', () => {
        expect(Object.keys(validate(valid, TODAY))).toHaveLength(0);
      });

      it('does not require optional fields', () => {
        const errors = validate(valid, TODAY);
        expect(Object.keys(errors)).not.toContain('phone');
        expect(Object.keys(errors)).not.toContain('aircraftType');
        expect(Object.keys(errors)).not.toContain('mtow');
        expect(Object.keys(errors)).not.toContain('remarks');
      });

      it('error values are strings', () => {
        const errors = validate({}, TODAY);
        Object.values(errors).forEach(msg => {
          expect(typeof msg).toBe('string');
        });
      });

      it('refuses an unknown aircraft category', () => {
        expect(validate({ ...valid, aircraftCategory: 'Rakete' }, TODAY).aircraftCategory)
          .toBe(i18n.t('validate.aircraftCategory'));
      });

      it.each([TODAY, '2027-11-13'])('accepts the planned date %s (today up to a year ahead)', plannedDate => {
        expect(validate({ ...valid, plannedDate }, TODAY).plannedDate).toBeUndefined();
      });

      it('refuses a planned date in the past, as the server does', () => {
        expect(validate({ ...valid, plannedDate: '2026-11-12' }, TODAY).plannedDate)
          .toBe(i18n.t('ppr.validation.plannedDatePast'));
      });

      it('refuses a planned date more than a year ahead, as the server does', () => {
        expect(validate({ ...valid, plannedDate: '2027-11-14' }, TODAY).plannedDate)
          .toBe(i18n.t('ppr.validation.plannedDateTooFar'));
      });

      describe('closures', () => {
        const closures = [
          { from: '2026-11-19', to: '2026-11-21', reason: 'Runway works' },
          { from: '2026-11-21', to: '2026-11-22', reason: 'Air show' },
        ];

        it.each(['2026-11-19', '2026-11-20', '2026-11-21'])(
          'refuses %s, a day of a closure, with its reason, as the server would reject it',
          plannedDate => {
            expect(validate({ ...valid, plannedDate }, TODAY, closures).plannedDate)
              .toBe(i18n.t('ppr.validation.plannedDateBlocked', { reason: 'Runway works' }));
          }
        );

        it('names the reason of the next closure that covers the day', () => {
          expect(validate({ ...valid, plannedDate: '2026-11-22' }, TODAY, closures).plannedDate)
            .toBe(i18n.t('ppr.validation.plannedDateBlocked', { reason: 'Air show' }));
        });

        it.each(['2026-11-18', '2026-11-23'])('accepts %s, a day without closure', plannedDate => {
          expect(validate({ ...valid, plannedDate }, TODAY, closures)).toEqual({});
        });

        it('tells about a date in the past first', () => {
          const past = [{ from: '2026-11-01', to: '2026-11-30', reason: 'Runway works' }];
          expect(validate({ ...valid, plannedDate: '2026-11-12' }, TODAY, past).plannedDate)
            .toBe(i18n.t('ppr.validation.plannedDatePast'));
        });

        it('knows no closures by default', () => {
          expect(validate({ ...valid, plannedDate: '2026-11-20' }, TODAY)).toEqual({});
        });

        it('shows the reason as it is', () => {
          const message = validate({ ...valid }, TODAY, [{ from: '2026-11-20', to: '2026-11-20', reason: 'Fly-in & BBQ' }]);
          expect(message.plannedDate).toContain('Fly-in & BBQ');
        });
      });

      it('uses the aerodrome date by default', () => {
        expect(validate({ ...valid, plannedDate: '2000-01-01' }).plannedDate)
          .toBe(i18n.t('ppr.validation.plannedDatePast'));
      });

      it('does not ask for the email address, which comes from the login', () => {
        expect(validate({ ...valid, email: 'no address' }, TODAY).email).toBeUndefined();
      });
    });

    describe('validateWithoutLogin', () => {
      const validWithoutLogin = { ...valid, email: 'max@example.com' };

      it('accepts a request with an email address', () => {
        expect(validateWithoutLogin(validWithoutLogin, TODAY)).toEqual({});
      });

      it.each([undefined, '', '  '])('asks for the email address when it is %p', email => {
        expect(validateWithoutLogin({ ...valid, email }, TODAY).email).toBe(i18n.t('validate.email'));
      });

      it.each([
        'max',
        'max@example',
        'max @example.com',
        'max@bluewin.c',
        'max@zürich.ch',
        `${'a'.repeat(250)}@example.com`,
      ])('refuses the email address %p as invalid, by the server\'s rule', email => {
        expect(validateWithoutLogin({ ...valid, email }, TODAY).email).toBe(i18n.t('ppr.withoutLogin.invalidEmail'));
      });

      it('accepts an address the server takes after trimming and lower-casing', () => {
        expect(validateWithoutLogin({ ...valid, email: ' Max@Example.COM ' }, TODAY)).toEqual({});
      });

      it('checks the other fields as with a login', () => {
        const errors = validateWithoutLogin({ email: 'max@example.com', plannedDate: '2026-11-12' }, TODAY);
        expect(Object.keys(errors)).toEqual(expect.arrayContaining(['firstname', 'lastname', 'immatriculation']));
        expect(errors.plannedDate).toBe(i18n.t('ppr.validation.plannedDatePast'));
      });

      it('refuses the days of the closures as with a login', () => {
        const closures = [{ from: '2026-11-20', to: '2026-11-20', reason: 'Air show' }];
        expect(validateWithoutLogin({ ...valid, email: 'max@example.com' }, TODAY, closures)).toEqual({
          plannedDate: i18n.t('ppr.validation.plannedDateBlocked', { reason: 'Air show' }),
        });
      });
    });
  });
});
