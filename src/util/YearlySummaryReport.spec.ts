// YearlySummaryReport reads __CONF__ at module load time. Use jest.resetModules()
// + require() so global.__CONF__ is set before any module executes.

describe('util', () => {
  describe('YearlySummaryReport', () => {
    let YearlySummaryReport;
    let MovementReport;
    let mockGenerate;

    beforeEach(() => {
      global.__CONF__ = {
        aerodrome: {
          ICAO: 'LSZT',
          runways: [
            {name: '10', type: 'A'},
            {name: '28', type: 'A'},
          ],
        },
        enabledFlightTypes: {0: 'private', 1: 'instruction'},
        memberManagement: false,
      };

      jest.resetModules();
      jest.mock('./MovementReport');
      jest.mock('./firebase');
      jest.mock('./aircrafts');
      jest.mock('./aerodromes');

      MovementReport = require('./MovementReport').default;
      YearlySummaryReport = require('./YearlySummaryReport').default;

      mockGenerate = jest.fn();
      MovementReport.mockImplementation(() => ({generate: mockGenerate}));
    });

    // Build a minimal CSV line that getMonthSummary can parse.
    // Column indices: 0=ARP, 1=TYPMO, 2=ACREG, 3=TYPTR, 4=NUMMO, 5=ORIDE, 6=PAX, 9=PIMO
    function buildCsvLine({
      typmo = 'A',
      typtr = 42,
      nummo = 1,
      oride = 'LSZT',
      pax = 0,
      rwy = '10',
    } = {}) {
      return `LSZT,${typmo},HB-KOF,${typtr},${nummo},${oride},${pax},20230601,1000,${rwy}`;
    }

    function buildCsv(lines) {
      const header = 'ARP,TYPMO,ACREG,TYPTR,NUMMO,ORIDE,PAX,DATMO,TIMMO,PIMO,TYPPI,DIRDE,CID,CDT,CDM';
      return [header, ...lines].join('\n');
    }

    describe('constructor', () => {
      it('stores year and options', () => {
        const report = new YearlySummaryReport(2023, {delimiter: ';'});
        expect(report.year).toBe(2023);
        expect(report.delimiter).toBe(';');
      });

      it('defaults delimiter to comma', () => {
        const report = new YearlySummaryReport(2023, {});
        expect(report.delimiter).toBe(',');
      });
    });

    describe('buildContent', () => {
      it('includes header row as first line', () => {
        const report = new YearlySummaryReport(2023, {});
        const emptyCsv = buildCsv([]);
        const monthsData = Array(12).fill(emptyCsv);
        const content = report.buildContent(monthsData);
        const firstLine = content.split('\n')[0];
        expect(firstLine).toContain('Month');
        expect(firstLine).toContain('RWY10');
        expect(firstLine).toContain('RWY28');
      });

      it('produces 13 lines total (1 header + 12 months)', () => {
        const report = new YearlySummaryReport(2023, {});
        const emptyCsv = buildCsv([]);
        const monthsData = Array(12).fill(emptyCsv);
        const content = report.buildContent(monthsData);
        expect(content.split('\n')).toHaveLength(13);
      });

      it('uses custom delimiter in header', () => {
        const report = new YearlySummaryReport(2023, {delimiter: ';'});
        const emptyCsv = buildCsv([]);
        const monthsData = Array(12).fill(emptyCsv);
        const content = report.buildContent(monthsData);
        expect(content.split('\n')[0]).toContain(';');
      });
    });

    describe('getMonthSummary', () => {
      it('returns a comma-delimited string with month number as first field', () => {
        const report = new YearlySummaryReport(2023, {});
        const result = report.getMonthSummary(3, buildCsv([]));
        expect(result.startsWith('3,')).toBe(true);
      });

      it('counts private arrival into PrivateAway when ORIDE is not local ICAO', () => {
        const report = new YearlySummaryReport(2023, {});
        const csv = buildCsv([buildCsvLine({typmo: 'A', typtr: 42, nummo: 1, oride: 'LSZB', pax: 0})]);
        const result = report.getMonthSummary(1, csv);
        const values = result.split(',');
        const header = YearlySummaryReport.header;
        expect(parseInt(values[header.indexOf('PrivateAway')])).toBe(1);
      });

      it('counts private arrival into PrivateLocal when ORIDE matches local ICAO', () => {
        const report = new YearlySummaryReport(2023, {});
        const csv = buildCsv([buildCsvLine({typmo: 'A', typtr: 42, nummo: 1, oride: 'LSZT', pax: 0})]);
        const result = report.getMonthSummary(1, csv);
        const values = result.split(',');
        const header = YearlySummaryReport.header;
        expect(parseInt(values[header.indexOf('PrivateLocal')])).toBe(1);
      });

      it('counts private departure into PrivateAway', () => {
        const report = new YearlySummaryReport(2023, {});
        const csv = buildCsv([buildCsvLine({typmo: 'D', typtr: 42, nummo: 1, oride: 'LSZB', pax: 0})]);
        const result = report.getMonthSummary(1, csv);
        const values = result.split(',');
        const header = YearlySummaryReport.header;
        expect(parseInt(values[header.indexOf('PrivateAway')])).toBe(1);
      });

      it('counts circuit movements (V) into PrivateCircuits', () => {
        const report = new YearlySummaryReport(2023, {});
        const csv = buildCsv([buildCsvLine({typmo: 'V', typtr: 42, nummo: 4, oride: 'LSZT', pax: 0})]);
        const result = report.getMonthSummary(1, csv);
        const values = result.split(',');
        const header = YearlySummaryReport.header;
        expect(parseInt(values[header.indexOf('PrivateCircuits')])).toBe(4);
      });

      it('counts private pax', () => {
        const report = new YearlySummaryReport(2023, {});
        const csv = buildCsv([buildCsvLine({typmo: 'A', typtr: 42, nummo: 1, oride: 'LSZB', pax: 3})]);
        const result = report.getMonthSummary(1, csv);
        const values = result.split(',');
        const header = YearlySummaryReport.header;
        expect(parseInt(values[header.indexOf('PrivatePax')])).toBe(3);
      });

      it('counts instruction arrival into InstructionAway when ORIDE != local ICAO', () => {
        const report = new YearlySummaryReport(2023, {});
        // typtr=43 (instruction aircraft)
        const csv = buildCsv([buildCsvLine({typmo: 'A', typtr: 43, nummo: 1, oride: 'LSZB', pax: 0})]);
        const result = report.getMonthSummary(1, csv);
        const values = result.split(',');
        const header = YearlySummaryReport.header;
        expect(parseInt(values[header.indexOf('InstructionAway')])).toBe(1);
      });

      it('counts instruction arrival into InstructionLocal when ORIDE matches local ICAO', () => {
        const report = new YearlySummaryReport(2023, {});
        const csv = buildCsv([buildCsvLine({typmo: 'A', typtr: 43, nummo: 1, oride: 'LSZT', pax: 0})]);
        const result = report.getMonthSummary(1, csv);
        const values = result.split(',');
        const header = YearlySummaryReport.header;
        expect(parseInt(values[header.indexOf('InstructionLocal')])).toBe(1);
      });

      it('counts instruction circuits into InstructionCircuits', () => {
        const report = new YearlySummaryReport(2023, {});
        const csv = buildCsv([buildCsvLine({typmo: 'V', typtr: 43, nummo: 6, oride: 'LSZT', pax: 0})]);
        const result = report.getMonthSummary(1, csv);
        const values = result.split(',');
        const header = YearlySummaryReport.header;
        expect(parseInt(values[header.indexOf('InstructionCircuits')])).toBe(6);
      });

      it('counts instruction pax', () => {
        const report = new YearlySummaryReport(2023, {});
        const csv = buildCsv([buildCsvLine({typmo: 'A', typtr: 43, nummo: 1, oride: 'LSZB', pax: 2})]);
        const result = report.getMonthSummary(1, csv);
        const values = result.split(',');
        const header = YearlySummaryReport.header;
        expect(parseInt(values[header.indexOf('InstructionPax')])).toBe(2);
      });

      it('counts helicopter movements into Helicopter', () => {
        const report = new YearlySummaryReport(2023, {});
        // typtr=64 (private helicopter)
        const csv = buildCsv([buildCsvLine({typmo: 'A', typtr: 64, nummo: 1, oride: 'LSZB', pax: 0})]);
        const result = report.getMonthSummary(1, csv);
        const values = result.split(',');
        const header = YearlySummaryReport.header;
        expect(parseInt(values[header.indexOf('Helicopter')])).toBe(1);
      });

      it('counts private helicopter circuits into PrivateCircuits', () => {
        const report = new YearlySummaryReport(2023, {});
        // typtr=64 (private helicopter), typmo=V (circuits)
        const csv = buildCsv([buildCsvLine({typmo: 'V', typtr: 64, nummo: 4, oride: 'LSZT', pax: 0})]);
        const result = report.getMonthSummary(1, csv);
        const values = result.split(',');
        const header = YearlySummaryReport.header;
        expect(parseInt(values[header.indexOf('PrivateCircuits')])).toBe(4);
      });

      it('counts runway usage into the appropriate RWY column', () => {
        const report = new YearlySummaryReport(2023, {});
        const csv = buildCsv([buildCsvLine({typmo: 'A', typtr: 42, nummo: 1, oride: 'LSZB', pax: 0, rwy: '28'})]);
        const result = report.getMonthSummary(1, csv);
        const values = result.split(',');
        const header = YearlySummaryReport.header;
        expect(parseInt(values[header.indexOf('RWY28')])).toBe(1);
        expect(parseInt(values[header.indexOf('RWY10')])).toBe(0);
      });

      it('calculates Total as sum of both runways', () => {
        const report = new YearlySummaryReport(2023, {});
        const csv = buildCsv([
          buildCsvLine({typmo: 'A', typtr: 42, nummo: 1, oride: 'LSZB', pax: 0, rwy: '10'}),
          buildCsvLine({typmo: 'A', typtr: 42, nummo: 1, oride: 'LSZB', pax: 0, rwy: '28'}),
        ]);
        const result = report.getMonthSummary(1, csv);
        const values = result.split(',');
        const header = YearlySummaryReport.header;
        expect(parseInt(values[header.indexOf('Total')])).toBe(2);
      });

      it('calculates TotalCircuits as sum of private and instruction circuits', () => {
        const report = new YearlySummaryReport(2023, {});
        const csv = buildCsv([
          buildCsvLine({typmo: 'V', typtr: 42, nummo: 2, oride: 'LSZT', pax: 0}),
          buildCsvLine({typmo: 'V', typtr: 43, nummo: 3, oride: 'LSZT', pax: 0}),
        ]);
        const result = report.getMonthSummary(1, csv);
        const values = result.split(',');
        const header = YearlySummaryReport.header;
        expect(parseInt(values[header.indexOf('TotalCircuits')])).toBe(5);
      });

      it('handles arrival with nummo > 1 (splits into arrival + circuits)', () => {
        const report = new YearlySummaryReport(2023, {});
        // nummo=3 means 1 real arrival + 2 circuits
        const csv = buildCsv([buildCsvLine({typmo: 'A', typtr: 42, nummo: 3, oride: 'LSZB', pax: 0})]);
        const result = report.getMonthSummary(1, csv);
        const values = result.split(',');
        const header = YearlySummaryReport.header;
        expect(parseInt(values[header.indexOf('PrivateAway')])).toBe(1);
        expect(parseInt(values[header.indexOf('PrivateCircuits')])).toBe(2);
      });

      it('handles instruction arrival with nummo > 1 (splits into arrival + circuits)', () => {
        const report = new YearlySummaryReport(2023, {});
        const csv = buildCsv([buildCsvLine({typmo: 'A', typtr: 43, nummo: 3, oride: 'LSZB', pax: 0})]);
        const result = report.getMonthSummary(1, csv);
        const values = result.split(',');
        const header = YearlySummaryReport.header;
        expect(parseInt(values[header.indexOf('InstructionAway')])).toBe(1);
        expect(parseInt(values[header.indexOf('InstructionCircuits')])).toBe(2);
      });

      it('ignores other flight types (aerotow) without throwing', () => {
        const report = new YearlySummaryReport(2023, {});
        // typtr=52 (aerotow - neither private nor instruction)
        const csv = buildCsv([buildCsvLine({typmo: 'A', typtr: 52, nummo: 1, oride: 'LSZB', pax: 0})]);
        expect(() => report.getMonthSummary(1, csv)).not.toThrow();
      });

      it('handles empty CSV (no data rows) producing zero totals', () => {
        const report = new YearlySummaryReport(2023, {});
        const result = report.getMonthSummary(1, buildCsv([]));
        const values = result.split(',');
        const header = YearlySummaryReport.header;
        expect(values[header.indexOf('Total')]).toBe('0');
        expect(values[header.indexOf('TotalCircuits')]).toBe('0');
      });

      it('uses semicolon delimiter when set', () => {
        const report = new YearlySummaryReport(2023, {delimiter: ';'});
        const result = report.getMonthSummary(1, buildCsv([]));
        expect(result).toContain(';');
      });

      it('accumulates circuit runway counts', () => {
        const report = new YearlySummaryReport(2023, {});
        // Circuits (V) on RWY28
        const csv = buildCsv([buildCsvLine({typmo: 'V', typtr: 42, nummo: 4, oride: 'LSZT', pax: 0, rwy: '28'})]);
        const result = report.getMonthSummary(1, csv);
        const values = result.split(',');
        const header = YearlySummaryReport.header;
        expect(parseInt(values[header.indexOf('RWY28')])).toBe(4);
      });

      it('throws for private movement with unexpected traffic type (not A or V) and nummo > 1', () => {
        const report = new YearlySummaryReport(2023, {});
        // typmo=D (departure) with nummo=3 and private flight type: should throw
        const csv = buildCsv([buildCsvLine({typmo: 'D', typtr: 42, nummo: 3, oride: 'LSZB', pax: 0})]);
        expect(() => report.getMonthSummary(1, csv)).toThrow('Unexpected traffic type: D');
      });

      it('throws for private movement with even nummo (not odd) when nummo > 1', () => {
        const report = new YearlySummaryReport(2023, {});
        // typmo=A, nummo=4 (even) -> unexpected count
        const csv = buildCsv([buildCsvLine({typmo: 'A', typtr: 42, nummo: 4, oride: 'LSZB', pax: 0})]);
        expect(() => report.getMonthSummary(1, csv)).toThrow('Unexpected mov count: 4');
      });

      it('throws for instruction movement with unexpected traffic type when nummo > 1', () => {
        const report = new YearlySummaryReport(2023, {});
        // typmo=D, typtr=43 (instruction), nummo=3 -> unexpected type
        const csv = buildCsv([buildCsvLine({typmo: 'D', typtr: 43, nummo: 3, oride: 'LSZB', pax: 0})]);
        expect(() => report.getMonthSummary(1, csv)).toThrow('Unexpected traffic type: D');
      });

      it('throws for instruction movement with even nummo when nummo > 1', () => {
        const report = new YearlySummaryReport(2023, {});
        // typmo=A, typtr=43 (instruction), nummo=4 -> unexpected count
        const csv = buildCsv([buildCsvLine({typmo: 'A', typtr: 43, nummo: 4, oride: 'LSZB', pax: 0})]);
        expect(() => report.getMonthSummary(1, csv)).toThrow('Unexpected mov count: 4');
      });
    });

    describe('build', () => {
      it('calls callback with a Download object', () => {
        const report = new YearlySummaryReport(2023, {});
        const emptyCsv = buildCsv([]);
        const monthsData = Array(12).fill(emptyCsv);

        const callback = jest.fn();
        report.build(monthsData, callback);

        expect(callback).toHaveBeenCalledTimes(1);
        const download = callback.mock.calls[0][0];
        expect(download.filename).toBe('summary_2023.csv');
        expect(download.content).toContain('data:text/csv');
      });
    });

    describe('readMovementData', () => {
      it('creates 12 MovementReport instances (one per month) with download=false', async () => {
        mockGenerate.mockImplementation((callback) => callback(buildCsv([])));

        const report = new YearlySummaryReport(2023, {});
        const data = await report.readMovementData();

        expect(MovementReport).toHaveBeenCalledTimes(12);
        expect(data).toHaveLength(12);

        // Verify each month is created with download:false option
        for (let i = 0; i < 12; i++) {
          const callArgs = MovementReport.mock.calls[i];
          expect(callArgs[0]).toBe(2023); // year
          expect(callArgs[1]).toBe(i + 1); // month 1..12
          expect(callArgs[2]).toEqual({download: false});
        }
      });

      it('resolves with CSV data from each month', async () => {
        const monthCsv = buildCsv([buildCsvLine({typmo: 'A', typtr: 42, nummo: 1})]);
        mockGenerate.mockImplementation((callback) => callback(monthCsv));

        const report = new YearlySummaryReport(2023, {});
        const data = await report.readMovementData();

        expect(data).toHaveLength(12);
        data.forEach(csv => expect(csv).toContain('ARP'));
      });
    });

    describe('generate', () => {
      it('calls callback with a Download object after reading movement data', () => {
        const emptyCsv = buildCsv([]);
        mockGenerate.mockImplementation((callback) => callback(emptyCsv));

        const report = new YearlySummaryReport(2023, {});
        const callback = jest.fn();

        return new Promise<void>(resolve => {
          report.generate((download) => {
            expect(download.filename).toBe('summary_2023.csv');
            expect(download.content).toContain('data:text/csv');
            resolve();
          });
        });
      });
    });

    describe('static header', () => {
      it('starts with Month', () => {
        expect(YearlySummaryReport.header[0]).toBe('Month');
      });

      it('contains runway columns matching config', () => {
        expect(YearlySummaryReport.header).toContain('RWY10');
        expect(YearlySummaryReport.header).toContain('RWY28');
      });

      it('contains private flight summary columns', () => {
        expect(YearlySummaryReport.header).toContain('PrivatePax');
        expect(YearlySummaryReport.header).toContain('PrivateLocal');
        expect(YearlySummaryReport.header).toContain('PrivateAway');
        expect(YearlySummaryReport.header).toContain('PrivateCircuits');
      });

      it('contains Total and TotalCircuits', () => {
        expect(YearlySummaryReport.header).toContain('Total');
        expect(YearlySummaryReport.header).toContain('TotalCircuits');
      });
    });
  });
});
