import parseCsv from './parseCsv';

const TEST_CSV_STRING =
  'UserName,LastName,FirstName,PhoneMobile\n' +
  '11069,Mustermann,Max,+41791234567\n' +
  '11293,Musterfrau,Maria,+41768765432\n';

describe('util', () => {
  describe('parseCsv', () => {
    it('should parse a CSV string', () => {
      return parseCsv(TEST_CSV_STRING).then(data => {
        expect(data).toEqual([
          ['UserName', 'LastName', 'FirstName', 'PhoneMobile'],
          ['11069', 'Mustermann', 'Max', '+41791234567'],
          ['11293', 'Musterfrau', 'Maria', '+41768765432']
        ]);
      });
    });
  });
});
