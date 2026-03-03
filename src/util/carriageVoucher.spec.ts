import {getItemLabel} from './carriageVoucher';

describe('util', () => {
  describe('carriageVoucher', () => {
    describe('getItemLabel', () => {
      it('should return the label', () => {
        expect(getItemLabel('yes')).toBe('Ja');
        expect(getItemLabel('no')).toBe('Nein');
      });

      it('should throw an error if item id is unknown', () => {
        expect(() => {
          getItemLabel('unknown')
        }).toThrow('Item "unknown" not found');
      });
    });
  });
});
