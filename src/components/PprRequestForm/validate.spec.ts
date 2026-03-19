import validate from './validate';

describe('components', () => {
  describe('PprRequestForm', () => {
    describe('validate', () => {
      it('returns errors for all missing required fields', () => {
        const errors = validate({});
        expect(Object.keys(errors)).toContain('firstname');
        expect(Object.keys(errors)).toContain('lastname');
        expect(Object.keys(errors)).toContain('immatriculation');
        expect(Object.keys(errors)).toContain('plannedDate');
        expect(Object.keys(errors)).toContain('plannedTime');
        expect(Object.keys(errors)).toContain('flightType');
      });

      it('returns no errors when all required fields are valid', () => {
        const errors = validate({
          firstname: 'Max',
          lastname: 'Muster',
          immatriculation: 'HB-ABC',
          plannedDate: '2026-04-15',
          plannedTime: '10:30',
          flightType: 'private',
        });
        expect(Object.keys(errors)).toHaveLength(0);
      });

      it('does not require optional fields', () => {
        const errors = validate({
          firstname: 'Max',
          lastname: 'Muster',
          immatriculation: 'HB-ABC',
          plannedDate: '2026-04-15',
          plannedTime: '10:30',
          flightType: 'private',
        });
        expect(Object.keys(errors)).not.toContain('phone');
        expect(Object.keys(errors)).not.toContain('aircraftType');
        expect(Object.keys(errors)).not.toContain('mtow');
        expect(Object.keys(errors)).not.toContain('remarks');
      });

      it('error values are strings', () => {
        const errors = validate({});
        Object.values(errors).forEach(msg => {
          expect(typeof msg).toBe('string');
        });
      });
    });
  });
});
