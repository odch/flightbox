import {getFromItemKey} from './reference-number';

describe('util', () => {
  describe('reference-number', () => {
    describe('getFromItemKey', () => {
      it('creates reference numbers from item key', () => {
        const refNumber = getFromItemKey('-KG7OujLL5ti7yrhmwr7');
        expect(refNumber).toBe('MWR7');
      });
    });
  });
});
