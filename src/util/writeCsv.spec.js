import expect from 'expect';
import writeCsv from './writeCsv';

describe('util', () => {
  describe('writeCsv', () => {
    it('should return an empty string if no records are given', () => {
      const records = [];

      return writeCsv(records).then(csv => {
        expect(csv).toEqual('');
      });
    });

    it('should write comma separated strings', () => {
      const records = [
        ['header1', 'header2'],
        ['value1.1', 'value1.2'],
        ['value2.1', 'value2.2'],
      ];

      const expectedCsv =
        'header1,header2\n' +
        'value1.1,value1.2\n' +
        'value2.1,value2.2\n';

      return writeCsv(records).then(csv => {
        expect(csv).toEqual(expectedCsv);
      });
    });

    it('should enclose values with commas in double quotes', () => {
      const records = [
        ['header1', 'header2'],
        ['value1', 'value, with, commas'],
      ];

      const expectedCsv =
        'header1,header2\n' +
        'value1,"value, with, commas"\n';

      return writeCsv(records).then(csv => {
        expect(csv).toEqual(expectedCsv);
      });
    });

    it('should enclose values with double quotes in double quotes und escape the double quotes', () => {
      const records = [
        ['header1', 'header2'],
        ['value1', 'value with "double quotes"'],
      ];

      const expectedCsv =
        'header1,header2\n' +
        'value1,"value with ""double quotes"""\n';

      return writeCsv(records).then(csv => {
        expect(csv).toEqual(expectedCsv);
      });
    });
  });
});
