// A non-UTC timezone, so that any local-time arithmetic in the date handling
// would show up as an off-by-one day rather than passing by coincidence.
process.env.TZ = 'America/New_York';

describe('util', () => {
  describe('InvoicesExcelReport', () => {
    let InvoicesExcelReport;
    let sanitizeSheetName;
    let columnLetter;
    let toDateValue;

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
      jest.mock('./firebase');
      jest.mock('firebase/database', () => ({
        get: jest.fn(),
        query: jest.fn(ref => ref),
        orderByChild: jest.fn(),
        startAt: jest.fn(),
        endAt: jest.fn(),
      }));

      const module = require('./InvoicesExcelReport');
      InvoicesExcelReport = module.default;
      sanitizeSheetName = module.sanitizeSheetName;
      columnLetter = module.columnLetter;
      toDateValue = module.toDateValue;
    });

    const makeReport = (year = 2023, month = 6, options = {}) =>
      new InvoicesExcelReport(year, month, options);

    const arrival = (overrides = {}) => Object.assign({
      date: '2023-06-01',
      time: '10:00',
      immatriculation: 'HB-KOF',
      mtow: 750,
      firstname: 'Max',
      lastname: 'Muster',
      email: 'max@example.com',
      flightType: 'private',
      feeTotalNet: 10,
      feeVat: 1,
      feeRoundingDifference: 0,
      feeTotalGross: 11,
    }, overrides);

    const declaration = (overrides = {}) => Object.assign({
      date: '2023-06-01',
      registration: 'HB-KOF',
      email: 'max@example.com',
      direction: 'arrival',
      fee: {totalNet: 10, vat: 1, roundingDifference: 0, totalGrossRounded: 11},
    }, overrides);

    let lastBuffer: any = null;

    /**
     * Render the sheets to a real xlsx buffer and read it back, so assertions
     * are made against what actually lands in the file.
     */
    async function render(report, recipientNames, arrivalRecipients = {}, customsRecipients = {}) {
      const {Workbook} = require('exceljs');
      const workbook = new Workbook();
      workbook.calcProperties.fullCalcOnLoad = true;

      report.addSheets(workbook, recipientNames, arrivalRecipients, customsRecipients);

      lastBuffer = await workbook.xlsx.writeBuffer();
      const reloaded = new Workbook();
      await reloaded.xlsx.load(lastBuffer);
      return reloaded;
    }

    /**
     * The formula cells of a rendered sheet, read straight out of the xlsx XML.
     *
     * exceljs's own reader reports a cached result of 0 as undefined, which
     * would hide whether zero totals actually reach the file — and a zero total
     * read as blank is exactly the failure the cached results exist to prevent.
     */
    async function writtenFormulas(sheetIndex = 1) {
      const JSZip = require('jszip');
      const zip = await JSZip.loadAsync(lastBuffer);
      const xml = await zip.file(`xl/worksheets/sheet${sheetIndex}.xml`).async('string');

      const cells: any[] = [];
      const pattern = /<c r="([A-Z]+\d+)"[^>]*><f>([^<]*)<\/f><v>([^<]*)<\/v><\/c>/g;
      let match;
      while ((match = pattern.exec(xml)) !== null) {
        cells.push({ref: match[1], formula: match[2], result: Number(match[3])});
      }
      return cells;
    }

    /** The row whose first cell matches the given text. */
    function rowStartingWith(sheet, text) {
      let found: any = null;
      sheet.eachRow(row => {
        if (!found && row.getCell(1).value === text) {
          found = row;
        }
      });
      return found;
    }

    describe('columnLetter', () => {
      it('maps the first columns to A, B, C', () => {
        expect(columnLetter(1)).toBe('A');
        expect(columnLetter(2)).toBe('B');
        expect(columnLetter(3)).toBe('C');
      });

      it('maps the last landing fee column to L', () => {
        expect(columnLetter(12)).toBe('L');
      });

      it('rolls over past Z', () => {
        expect(columnLetter(26)).toBe('Z');
        expect(columnLetter(27)).toBe('AA');
        expect(columnLetter(28)).toBe('AB');
      });
    });

    describe('toDateValue', () => {
      it('converts a local date string to a UTC date', () => {
        const value = toDateValue('2023-06-01');
        expect(value).toBeInstanceOf(Date);
        expect(value.getUTCFullYear()).toBe(2023);
        expect(value.getUTCMonth()).toBe(5);
        expect(value.getUTCDate()).toBe(1);
      });

      it('passes through values that are not plain local dates', () => {
        expect(toDateValue('2023-06-01T10:00:00Z')).toBe('2023-06-01T10:00:00Z');
        expect(toDateValue(undefined)).toBeUndefined();
        expect(toDateValue(42)).toBe(42);
      });
    });

    describe('sanitizeSheetName', () => {
      it('keeps an ordinary name unchanged', () => {
        expect(sanitizeSheetName('Company A')).toBe('Company A');
      });

      it('replaces the characters Excel forbids', () => {
        expect(sanitizeSheetName('A/B:C*D?E[F]G\\H')).toBe('A B C D E F G H');
      });

      it('truncates to 31 characters', () => {
        const name = sanitizeSheetName('x'.repeat(50));
        expect(name).toHaveLength(31);
      });

      it('falls back when the name is empty after cleaning', () => {
        expect(sanitizeSheetName('///')).toBe('Rechnungsempfänger');
        expect(sanitizeSheetName('')).toBe('Rechnungsempfänger');
      });

      it('de-duplicates against names already used', () => {
        expect(sanitizeSheetName('Company A', ['Company A'])).toBe('Company A (2)');
        expect(sanitizeSheetName('Company A', ['Company A', 'Company A (2)']))
          .toBe('Company A (3)');
      });

      it('keeps a de-duplicated long name within the length limit', () => {
        const base = sanitizeSheetName('y'.repeat(50));
        const name = sanitizeSheetName('y'.repeat(50), [base]);
        expect(name.length).toBeLessThanOrEqual(31);
        expect(name.endsWith(' (2)')).toBe(true);
      });

      it('de-duplicates case-insensitively, as Excel does', () => {
        // exceljs rejects names differing only in case, which would abort the
        // whole report.
        expect(sanitizeSheetName('flugschule ag', ['Flugschule AG']))
          .toBe('flugschule ag (2)');
      });

      it('strips leading and trailing single quotes', () => {
        expect(sanitizeSheetName("'Air Service'")).toBe('Air Service');
      });

      it('strips a quote that was already at the edge before truncation', () => {
        const name = sanitizeSheetName('x'.repeat(30) + "''''");
        expect(name.endsWith("'")).toBe(false);
      });

      it('strips a quote that truncation newly exposes at the edge', () => {
        // The quote sits mid-string in the original name, so the first trim
        // pass leaves it alone; only cutting at 31 chars lands exactly on it.
        const name = 'x'.repeat(30) + "'" + 'y'.repeat(5);
        expect(name.length).toBeGreaterThan(31);
        expect(name.substring(0, 31).endsWith("'")).toBe(true);

        const result = sanitizeSheetName(name);
        expect(result.endsWith("'")).toBe(false);
      });

      it('avoids the reserved name History', () => {
        expect(sanitizeSheetName('History')).not.toBe('History');
      });

      it('falls back for a nullish name', () => {
        expect(sanitizeSheetName(null as any)).toBe('Rechnungsempfänger');
        expect(sanitizeSheetName(undefined as any)).toBe('Rechnungsempfänger');
      });

      it('falls back when the cleaned name survives but collapses to nothing after the final quote trim', () => {
        // The forbidden-character strip leaves the surrounding spaces alone (a
        // quote is not a forbidden character), so the first trim only removes
        // whitespace and 'cleaned' comes out as a lone quote — non-empty, so
        // the fallback used while building 'base' is skipped. Only the very
        // last trim (after substring) reduces it to '', which is what the
        // final `|| fallback` exists to catch.
        expect(sanitizeSheetName("  '  ")).toBe('Rechnungsempfänger');
      });

      it('distinguishes names that collide only after truncation', () => {
        const first = sanitizeSheetName('z'.repeat(31) + 'AAA');
        const second = sanitizeSheetName('z'.repeat(31) + 'BBB', [first]);
        expect(second).not.toBe(first);
      });
    });

    describe('addSheets', () => {
      it('adds one sheet per recipient, in the given order', async () => {
        const report = makeReport();
        const workbook = await render(report, ['Online-Zahlungen', 'Company A'], {
          'Company A': [arrival()],
        });
        expect(workbook.worksheets.map(sheet => sheet.name))
          .toEqual(['Online-Zahlungen', 'Company A']);
      });

      it('titles each sheet with the recipient and month', async () => {
        const report = makeReport(2023, 6);
        const workbook = await render(report, ['Company A'], {'Company A': [arrival()]});
        expect(workbook.getWorksheet('Company A').getCell('A1').value)
          .toBe('Company A (Juni 2023)');
      });

      it('uses the untruncated recipient name in the title even when the sheet name is cut', async () => {
        const longName = 'A very long invoice recipient name indeed';
        const report = makeReport();
        const workbook = await render(report, [longName], {[longName]: [arrival()]});
        const sheet = workbook.worksheets[0];
        expect(sheet.name.length).toBeLessThanOrEqual(31);
        expect(sheet.getCell('A1').value).toContain(longName);
      });

      it('gives colliding recipient names distinct sheets', async () => {
        const report = makeReport();
        const workbook = await render(report, ['A/B', 'A:B'], {
          'A/B': [arrival()],
          'A:B': [arrival()],
        });
        const names = workbook.worksheets.map(sheet => sheet.name);
        expect(new Set(names).size).toBe(2);
      });

      it('survives recipient names that Excel would reject', async () => {
        // Recipient names are user-controlled; any of these makes exceljs throw
        // if it reaches addWorksheet unsanitised, which would abort the report.
        const names = [
          'History',
          "'Air Service'",
          'Flugschule AG',
          'flugschule ag',
          'A/B:C*D?E[F]',
          'A very long invoice recipient name that goes on and on',
          '',
        ];
        const report = makeReport();
        const arrivalRecipients = {};
        names.forEach(name => { arrivalRecipients[name] = [arrival()]; });

        const workbook = await render(report, names, arrivalRecipients);

        const sheetNames = workbook.worksheets.map(sheet => sheet.name);
        expect(sheetNames).toHaveLength(names.length);
        expect(new Set(sheetNames.map(n => n.toLowerCase())).size).toBe(names.length);
        sheetNames.forEach(name => {
          expect(name.length).toBeLessThanOrEqual(31);
          expect(name).not.toBe('History');
          expect(/[[\]:*?/\\]/.test(name)).toBe(false);
          expect(/(^')|('$)/.test(name)).toBe(false);
        });
      });

      it('writes a fallback sheet with the no-recipients message', async () => {
        const report = makeReport(2023, 6);
        const workbook = await render(report, []);
        expect(workbook.worksheets).toHaveLength(1);
        expect(workbook.worksheets[0].getCell('A1').value)
          .toContain('Keine Rechnungsempfänger');
      });

      it('still adds a sheet for a recipient with no rows', async () => {
        const report = makeReport();
        const workbook = await render(report, ['Online-Zahlungen']);
        expect(workbook.worksheets.map(sheet => sheet.name)).toEqual(['Online-Zahlungen']);
        expect(await writtenFormulas()).toHaveLength(0);
      });
    });

    describe('styling', () => {
      const GRAY_FILL = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFD9D9D9'}};
      const NO_FILL = {type: 'pattern', pattern: 'none'};
      const THIN_BLACK = {style: 'thin', color: {argb: 'FF000000'}};

      it('fills the title row across the widest table\'s full width, regardless of title length', async () => {
        // A short title still needs the full 12-column span, since the
        // landing fees table (the widest) may follow it.
        const report = makeReport(2023, 6);
        const workbook = await render(report, [''], {'': [arrival()]});
        const sheet = workbook.getWorksheet('Rechnungsempfänger');
        for (let column = 1; column <= 12; column++) {
          expect(sheet.getRow(1).getCell(column).fill).toEqual(GRAY_FILL);
        }
        expect(sheet.getRow(1).getCell(13).fill).toBeUndefined();
      });

      it('fills the subheader row and closes off its top edge with corner ticks', async () => {
        const report = makeReport();
        const workbook = await render(report, ['Company A'], {'Company A': [arrival()]});
        const sheet = workbook.getWorksheet('Company A');
        const subHeaderRow = sheet.getRow(3);

        expect(subHeaderRow.getCell(1).border).toEqual({top: THIN_BLACK, left: THIN_BLACK});
        for (let column = 2; column <= 11; column++) {
          expect(subHeaderRow.getCell(column).border).toEqual({top: THIN_BLACK});
        }
        expect(subHeaderRow.getCell(12).border).toEqual({top: THIN_BLACK, right: THIN_BLACK});
        for (let column = 1; column <= 12; column++) {
          expect(subHeaderRow.getCell(column).fill).toEqual(GRAY_FILL);
        }
      });

      it('fills and borders the header row across every column', async () => {
        const report = makeReport();
        const workbook = await render(report, ['Company A'], {'Company A': [arrival()]});
        const sheet = workbook.getWorksheet('Company A');
        const headerRow = sheet.getRow(4);
        for (let column = 1; column <= 12; column++) {
          expect(headerRow.getCell(column).fill).toEqual(GRAY_FILL);
          expect(headerRow.getCell(column).border).toEqual({
            top: THIN_BLACK, left: THIN_BLACK, bottom: THIN_BLACK, right: THIN_BLACK,
          });
        }
      });

      it('borders every data row cell without filling it', async () => {
        const report = makeReport();
        const workbook = await render(report, ['Company A'], {'Company A': [arrival()]});
        const sheet = workbook.getWorksheet('Company A');
        const dataRow = sheet.getRow(5);
        for (let column = 1; column <= 12; column++) {
          expect(dataRow.getCell(column).border).toEqual({
            top: THIN_BLACK, left: THIN_BLACK, bottom: THIN_BLACK, right: THIN_BLACK,
          });
          expect(dataRow.getCell(column).fill).toEqual(NO_FILL);
        }
      });

      it('fills and borders the totals row across every column, even non-total ones', async () => {
        const report = makeReport();
        const workbook = await render(report, ['Company A'], {'Company A': [arrival()]});
        const sheet = workbook.getWorksheet('Company A');
        const totalsRow = sheet.getRow(6);
        for (let column = 1; column <= 12; column++) {
          expect(totalsRow.getCell(column).fill).toEqual(GRAY_FILL);
          expect(totalsRow.getCell(column).border).toEqual({
            top: THIN_BLACK, left: THIN_BLACK, bottom: THIN_BLACK, right: THIN_BLACK,
          });
        }
      });
    });

    describe('landing fees table', () => {
      it('writes amounts as numbers, not formatted strings', async () => {
        const report = makeReport();
        const workbook = await render(report, ['Company A'], {
          'Company A': [arrival({feeTotalNet: 14.5, feeVat: 1.2, feeRoundingDifference: 0.3, feeTotalGross: 16})],
        });
        const sheet = workbook.getWorksheet('Company A');
        const dataRow = sheet.getRow(5);
        expect(typeof dataRow.getCell(9).value).toBe('number');
        expect(dataRow.getCell(9).value).toBe(14.5);
        expect(dataRow.getCell(12).value).toBe(16);
        expect(dataRow.getCell(12).numFmt).toBe('#,##0.00');
      });

      it('writes the date as a real date on the intended calendar day', async () => {
        const report = makeReport();
        const workbook = await render(report, ['Company A'], {
          'Company A': [arrival({date: '2023-06-01'})],
        });
        const sheet = workbook.getWorksheet('Company A');
        const dateCell = sheet.getRow(5).getCell(1);
        expect(dateCell.value).toBeInstanceOf(Date);
        expect(dateCell.value.toISOString().substring(0, 10)).toBe('2023-06-01');
      });

      it('totals each amount column with a SUM formula carrying a cached result', async () => {
        const report = makeReport();
        const workbook = await render(report, ['Company A'], {
          'Company A': [
            arrival({feeTotalNet: 10, feeVat: 1, feeRoundingDifference: 0, feeTotalGross: 11}),
            arrival({feeTotalNet: 20, feeVat: 2, feeRoundingDifference: 0, feeTotalGross: 22}),
          ],
        });
        const totals = await writtenFormulas();

        expect(totals).toHaveLength(4);
        expect(totals.map(cell => cell.result)).toEqual([30, 3, 0, 33]);
        totals.forEach(cell => {
          expect(cell.formula).toMatch(/^SUM\([A-Z]+\d+:[A-Z]+\d+\)$/);
        });
      });

      it('sums exactly the rows of its own table', async () => {
        const report = makeReport();
        await render(report, ['Company A'], {
          'Company A': [arrival(), arrival()],
        });
        // Title (1), spacer (2), subheader (3), header (4), two data rows (5-6).
        expect((await writtenFormulas())[0].formula).toBe('SUM(I5:I6)');
      });

      it('leaves net, VAT and rounding empty for transition-month rows', async () => {
        const report = makeReport();
        const workbook = await render(report, ['Company A'], {
          'Company A': [arrival({
            feeTotalNet: undefined,
            feeVat: undefined,
            feeRoundingDifference: undefined,
            feeTotalGross: undefined,
            landingFeeTotal: 20,
          })],
        });
        const sheet = workbook.getWorksheet('Company A');
        const dataRow = sheet.getRow(5);

        expect(dataRow.getCell(9).value).toBeNull();
        expect(dataRow.getCell(10).value).toBeNull();
        expect(dataRow.getCell(11).value).toBeNull();
        expect(dataRow.getCell(12).value).toBe(20);
      });

      it('keeps cached totals consistent with SUM over blanks in the transition month', async () => {
        const report = makeReport();
        const workbook = await render(report, ['Company A'], {
          'Company A': [
            arrival({
              feeTotalNet: undefined, feeVat: undefined,
              feeRoundingDifference: undefined, feeTotalGross: undefined,
              landingFeeTotal: 20,
            }),
            arrival({feeTotalNet: 10, feeVat: 1, feeRoundingDifference: 0, feeTotalGross: 11}),
          ],
        });
        const totals = await writtenFormulas();
        // SUM ignores the blank cells, matching the JS accumulation exactly.
        expect(totals.map(cell => cell.result)).toEqual([10, 1, 0, 31]);
      });
    });

    describe('malformed amounts', () => {
      it('writes no total at all rather than NaN when an amount is missing', async () => {
        const report = makeReport();
        await render(report, ['Company A'], {
          'Company A': [arrival({
            feeTotalNet: undefined, feeVat: undefined,
            feeRoundingDifference: undefined, feeTotalGross: undefined,
            landingFeeTotal: undefined,
          })],
        });
        const totals = await writtenFormulas();
        // A NaN here would make Excel report the workbook as corrupt.
        totals.forEach(cell => expect(Number.isNaN(cell.result)).toBe(false));
        expect(totals.map(cell => cell.result)).toEqual([0, 0, 0, 0]);
      });

      it('does not let one malformed row poison the column total', async () => {
        const report = makeReport();
        await render(report, ['Company A'], {
          'Company A': [
            arrival({feeTotalGross: undefined, landingFeeTotal: undefined}),
            arrival({feeTotalNet: 10, feeVat: 1, feeRoundingDifference: 0, feeTotalGross: 11}),
          ],
        });
        expect((await writtenFormulas()).map(cell => cell.result)).toEqual([10, 1, 0, 11]);
      });

      it('survives a customs declaration with no fee', async () => {
        const report = makeReport();
        await render(report, ['Company A'], {}, {
          'Company A': [declaration({fee: undefined})],
        });
        expect((await writtenFormulas()).map(cell => cell.result)).toEqual([0, 0, 0, 0]);
      });
    });

    describe('customs fees tables', () => {
      it('writes cancelled and non-cancelled declarations to separate tables', async () => {
        const report = makeReport();
        const workbook = await render(report, ['Company A'], {}, {
          'Company A': [declaration(), declaration({cancelled: true})],
        });
        const sheet = workbook.getWorksheet('Company A');

        expect(rowStartingWith(sheet, 'Zollgebühren')).not.toBeNull();
        expect(rowStartingWith(sheet, 'Zollgebühren ANNULLIERT')).not.toBeNull();
        // Four total columns per table, two tables.
        expect(await writtenFormulas()).toHaveLength(8);
      });

      it('omits the cancelled table when nothing is cancelled', async () => {
        const report = makeReport();
        const workbook = await render(report, ['Company A'], {}, {
          'Company A': [declaration()],
        });
        const sheet = workbook.getWorksheet('Company A');
        expect(rowStartingWith(sheet, 'Zollgebühren ANNULLIERT')).toBeNull();
        expect(await writtenFormulas()).toHaveLength(4);
      });

      it('handles a numeric fee as a transition-month fallback', async () => {
        const report = makeReport();
        await render(report, ['Company A'], {}, {
          'Company A': [declaration({fee: 15})],
        });
        const totals = await writtenFormulas();
        expect(totals.map(cell => cell.result)).toEqual([0, 0, 0, 15]);
      });

      it('translates the direction', async () => {
        const report = makeReport();
        const workbook = await render(report, ['Company A'], {}, {
          'Company A': [declaration({direction: 'departure'})],
        });
        const sheet = workbook.getWorksheet('Company A');
        expect(sheet.getRow(5).getCell(4).value).toBe('Ausflug');
      });
    });

    describe('build', () => {
      it('resolves with an xlsx blob', async () => {
        const report = makeReport();
        const blob = await report.build({
          recipientNames: ['Company A'],
          arrivalRecipients: {'Company A': [arrival()]},
          customsRecipients: {},
        });
        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type)
          .toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        expect(blob.size).toBeGreaterThan(0);
      });

      it('marks the workbook for full recalculation on load', async () => {
        const {Workbook} = require('exceljs');
        const report = makeReport();
        const workbook = new Workbook();
        workbook.calcProperties.fullCalcOnLoad = true;
        report.addSheets(workbook, ['Company A'], {'Company A': [arrival()]}, {});
        expect(workbook.calcProperties.fullCalcOnLoad).toBe(true);
      });
    });

    describe('generate', () => {
      it('resolves with the blob once the data is collected', async () => {
        const report = makeReport();
        report.collect = jest.fn().mockResolvedValue({
          recipientNames: ['Company A'],
          arrivalRecipients: {'Company A': [arrival()]},
          customsRecipients: {},
        });

        await expect(report.generate()).resolves.toBeInstanceOf(Blob);
      });

      it('rejects when the data cannot be collected', async () => {
        const report = makeReport();
        report.collect = jest.fn().mockRejectedValue(new Error('customs down'));

        // A silently swallowed failure would leave the form stuck showing the
        // report as still being generated.
        await expect(report.generate()).rejects.toThrow('customs down');
      });
    });
  });
});
