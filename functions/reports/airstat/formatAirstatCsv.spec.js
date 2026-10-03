'use strict';

const { airstatColumns, formatAirstatCsv } = require('./formatAirstatCsv');

describe('functions', () => {
  describe('reports/airstat/formatAirstatCsv', () => {
    it.each([
      [false, false, 15],
      [false, true, 15],
      [true, false, 28],
      [true, true, 29],
    ])('internal %s, memberManagement %s gives %i columns', (internal, memberManagement, count) => {
      expect(airstatColumns({ internal, memberManagement })).toHaveLength(count);
    });

    it('puts MEMBERNR right after KEY', () => {
      const columns = airstatColumns({ internal: true, memberManagement: true });
      expect(columns.slice(14, 18)).toEqual(['CDM', 'KEY', 'MEMBERNR', 'LASTNAME']);
    });

    it('writes the header row and one row per record', () => {
      const record = { ARP: 'LSZE', ACREG: 'HBKOF', REMARKS: 'a;b', KEY: 'NA1' };
      expect(formatAirstatCsv([record], { internal: false })).toBe(
        'ARP,TYPMO,ACREG,TYPTR,NUMMO,ORIDE,PAX,DATMO,TIMMO,PIMO,TYPPI,DIRDE,CID,CDT,CDM\n'
        + 'LSZE,,HBKOF,,,,,,,,,,,,\n'
      );
      expect(formatAirstatCsv([record], { internal: true, delimiter: ';' }).split('\n')[1])
        .toBe('LSZE;;HBKOF;;;;;;;;;;;;;NA1;;;;;;;"a;b";;;;;');
    });

    it('writes only the header for an empty month', () => {
      expect(formatAirstatCsv([], { internal: false, delimiter: ';' }).split('\n')).toHaveLength(2);
    });
  });
});
