import validate from './validate';
import i18n from '../../i18n';

const TODAY = '2026-11-13';

const valid = {
  firstname: 'Max',
  lastname: 'Muster',
  immatriculation: 'HB-ABC',
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

      it('uses the aerodrome date by default', () => {
        expect(validate({ ...valid, plannedDate: '2000-01-01' }).plannedDate)
          .toBe(i18n.t('ppr.validation.plannedDatePast'));
      });
    });
  });
});
