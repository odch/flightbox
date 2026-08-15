import neutralizeCsvValue from './neutralizeCsvValue';

describe('util', () => {
  describe('neutralizeCsvValue', () => {
    it('prefixes values starting with a formula character', () => {
      expect(neutralizeCsvValue('=1+1')).toEqual("'=1+1");
      expect(neutralizeCsvValue('+1')).toEqual("'+1");
      expect(neutralizeCsvValue('-1')).toEqual("'-1");
      expect(neutralizeCsvValue('@SUM(A1)')).toEqual("'@SUM(A1)");
      expect(neutralizeCsvValue('=HYPERLINK("http://evil")')).toEqual("'=HYPERLINK(\"http://evil\")");
    });

    it('prefixes values starting with a tab or carriage return', () => {
      expect(neutralizeCsvValue('\t=1')).toEqual("'\t=1");
      expect(neutralizeCsvValue('\r=1')).toEqual("'\r=1");
    });

    it('leaves safe strings unchanged', () => {
      expect(neutralizeCsvValue('HBABC')).toEqual('HBABC');
      expect(neutralizeCsvValue('normal text')).toEqual('normal text');
      expect(neutralizeCsvValue('a=b')).toEqual('a=b');
    });

    it('leaves non-strings unchanged', () => {
      expect(neutralizeCsvValue(42)).toEqual(42);
      expect(neutralizeCsvValue(0)).toEqual(0);
      expect(neutralizeCsvValue(undefined)).toEqual(undefined);
      expect(neutralizeCsvValue(null)).toEqual(null);
    });
  });
});
