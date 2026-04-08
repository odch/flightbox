import validate from './validate';

describe('components', () => {
  describe('MessageForm', () => {
    describe('validate', () => {
      it('returns errors for all missing required fields', () => {
        const errors = validate({});
        expect(Object.keys(errors)).toContain('name');
        expect(Object.keys(errors)).toContain('email');
        expect(Object.keys(errors)).toContain('message');
        expect(Object.keys(errors)).not.toContain('phone');
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

      it('returns no errors when phone is omitted', () => {
        const errors = validate({
          name: 'Hans Muster',
          email: 'hans@example.com',
          message: 'Hello'
        });
        expect(Object.keys(errors)).toHaveLength(0);
      });

      it('returns no error for valid phone numbers', () => {
        const valid = ['+41 79 123 45 67', '079 123 45 67', '+41791234567', '0791234567'];
        valid.forEach(phone => {
          const errors = validate({
            name: 'Hans',
            phone,
            email: 'hans@example.com',
            message: 'Hi'
          });
          expect(errors['phone']).toBeUndefined();
        });
      });

      it('returns error for invalid phone number', () => {
        const invalid = ['abc', '12'];
        invalid.forEach(phone => {
          const errors = validate({
            name: 'Hans',
            phone,
            email: 'hans@example.com',
            message: 'Hi'
          });
          expect(errors['phone']).toBeDefined();
        });
      });

      it('returns email error for invalid email format', () => {
        const errors = validate({
          name: 'Hans',
          phone: '0791234567',
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
