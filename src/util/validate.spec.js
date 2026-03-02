import validate from './validate';

describe('util', () => {
  describe('validate', () => {
    describe('required', () => {
      const config = {
        name: {types: {required: true}, message: 'Name required'},
      };

      it('returns error when required field is missing', () => {
        const errors = validate({}, config);
        expect(errors).toHaveLength(1);
        expect(errors[0].key).toBe('name');
        expect(errors[0].message).toBe('Name required');
      });

      it('returns no error when required field is present', () => {
        const errors = validate({name: 'John'}, config);
        expect(errors).toHaveLength(0);
      });
    });

    describe('integer', () => {
      const config = {
        count: {types: {integer: true}, message: 'Must be integer'},
      };

      it('returns error when value is a float', () => {
        const errors = validate({count: 1.5}, config);
        expect(errors).toHaveLength(1);
      });

      it('returns no error when value is an integer', () => {
        const errors = validate({count: 5}, config);
        expect(errors).toHaveLength(0);
      });

      it('returns error when value is a string that is not integer', () => {
        const errors = validate({count: '1.5'}, config);
        expect(errors).toHaveLength(1);
      });
    });

    describe('match', () => {
      const config = {
        email: {types: {match: /^[a-z]+@[a-z]+\.[a-z]+$/}, message: 'Invalid email'},
      };

      it('returns error when value does not match pattern', () => {
        const errors = validate({email: 'notanemail'}, config);
        expect(errors).toHaveLength(1);
      });

      it('returns no error when value matches pattern', () => {
        const errors = validate({email: 'user@example.com'}, config);
        expect(errors).toHaveLength(0);
      });
    });

    describe('values', () => {
      const config = {
        type: {types: {values: ['a', 'b', 'c']}, message: 'Invalid value'},
      };

      it('returns error when value not in allowed values', () => {
        const errors = validate({type: 'd'}, config);
        expect(errors).toHaveLength(1);
      });

      it('returns no error when value is in allowed values', () => {
        const errors = validate({type: 'b'}, config);
        expect(errors).toHaveLength(0);
      });
    });

    describe('unknown type', () => {
      it('throws error for unknown validation type', () => {
        const config = {
          field: {types: {unknownType: true}, message: 'Error'},
        };
        expect(() => validate({field: 'value'}, config)).toThrow('Unknown validation type: unknownType');
      });
    });

    describe('getMessage', () => {
      it('returns string message directly', () => {
        const config = {
          name: {types: {required: true}, message: 'Name is required'},
        };
        const errors = validate({}, config);
        expect(errors[0].message).toBe('Name is required');
      });

      it('returns type-specific message when type is provided', () => {
        const config = {
          time: {
            types: {required: true},
            message: {departure: 'Departure time required', arrival: 'Arrival time required'},
          },
        };
        const errors = validate({}, config, 'departure');
        expect(errors[0].message).toBe('Departure time required');
      });

      it('returns other type-specific message when different type provided', () => {
        const config = {
          time: {
            types: {required: true},
            message: {departure: 'Departure time required', arrival: 'Arrival time required'},
          },
        };
        const errors = validate({}, config, 'arrival');
        expect(errors[0].message).toBe('Arrival time required');
      });
    });

    describe('multiple fields', () => {
      it('returns errors for all invalid fields', () => {
        const config = {
          name: {types: {required: true}, message: 'Name required'},
          email: {types: {required: true}, message: 'Email required'},
        };
        const errors = validate({}, config);
        expect(errors).toHaveLength(2);
        const keys = errors.map(e => e.key);
        expect(keys).toContain('name');
        expect(keys).toContain('email');
      });
    });
  });
});
