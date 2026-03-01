import validate from './validate';

describe('components', () => {
  describe('MessageForm', () => {
    describe('validate', () => {
      it('returns errors for all missing fields', () => {
        const errors = validate({});
        expect(Object.keys(errors)).toContain('name');
        expect(Object.keys(errors)).toContain('phone');
        expect(Object.keys(errors)).toContain('email');
        expect(Object.keys(errors)).toContain('message');
      });

      it('returns no errors when all fields are valid', () => {
        const errors = validate({
          name: 'Hans Muster',
          phone: '0791234567',
          email: 'hans@example.com',
          message: 'Hello'
        });
        expect(Object.keys(errors)).toHaveLength(0);
      });

      it('returns email error for invalid email format', () => {
        const errors = validate({
          name: 'Hans',
          phone: '079',
          email: 'not-an-email',
          message: 'Hi'
        });
        expect(Object.keys(errors)).toContain('email');
        expect(Object.keys(errors)).not.toContain('name');
        expect(Object.keys(errors)).not.toContain('phone');
        expect(Object.keys(errors)).not.toContain('message');
      });

      it('returns email error when email is missing', () => {
        const errors = validate({
          name: 'Hans',
          phone: '079',
          email: '',
          message: 'Hi'
        });
        expect(Object.keys(errors)).toContain('email');
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
