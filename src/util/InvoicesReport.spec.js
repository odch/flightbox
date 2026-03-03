// InvoicesReport imports pdfmake and firebase; set __CONF__ before module load.
// Use jest.resetModules() + require() pattern.

describe('util', () => {
  describe('InvoicesReport', () => {
    let InvoicesReport;
    let firebase;
    let pdfMake;

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
      jest.mock('pdfmake/build/pdfmake', () => ({
        createPdf: jest.fn(() => ({getBase64: jest.fn()})),
      }));
      jest.mock('pdfmake/build/vfs_fonts', () => ({}));

      firebase = require('./firebase').default;
      pdfMake = require('pdfmake/build/pdfmake');
      InvoicesReport = require('./InvoicesReport').default;
    });

    // Helper: build a Firebase snapshot record from a local-format arrival.
    // firebaseToLocal converts dateTime (UTC ISO) -> local date/time.
    function makeArrivalRecord(arrival) {
      const dateTime = new Date(`${arrival.date}T${arrival.time}:00`).toISOString();
      return {
        key: arrival.key || 'key-abc1',
        val: () => ({
          dateTime,
          immatriculation: arrival.immatriculation || 'HB-KOF',
          mtow: arrival.mtow || 750,
          flightType: arrival.flightType || 'private',
          aircraftCategory: arrival.aircraftCategory || 'Flugzeug',
          firstname: arrival.firstname || 'Max',
          lastname: arrival.lastname || 'Muster',
          email: arrival.email || 'max@example.com',
          feeTotalNet: arrival.feeTotalNet,
          feeVat: arrival.feeVat,
          feeRoundingDifference: arrival.feeRoundingDifference,
          feeTotalGross: arrival.feeTotalGross,
          landingFeeTotal: arrival.landingFeeTotal,
          paymentMethod: arrival.paymentMethod,
        }),
      };
    }

    function makeArrivalsSnapshot(arrivals) {
      const records = arrivals.map(makeArrivalRecord);
      return {forEach: (fn) => records.forEach(fn)};
    }

    function makeReport(year = 2023, month = 6, options = {}) {
      return new InvoicesReport(year, month, options);
    }

    describe('constructor', () => {
      it('pads single-digit month', () => {
        const report = makeReport(2023, 3);
        expect(report.startDate).toBe('2023-03-01');
      });

      it('computes endDate as end of month', () => {
        const report = makeReport(2023, 2);
        expect(report.endDate).toBe('2023-02-28');
      });

      it('stores year and month', () => {
        const report = makeReport(2023, 6);
        expect(report.year).toBe(2023);
        expect(report.month).toBe(6);
      });

      it('does not pad two-digit month', () => {
        const report = makeReport(2023, 10);
        expect(report.startDate).toBe('2023-10-01');
      });
    });

    describe('getMonthLabel', () => {
      it('returns a string containing the year', () => {
        const report = makeReport(2023, 6);
        const label = report.getMonthLabel();
        expect(label).toContain('2023');
      });

      it('returns June label in German', () => {
        const report = makeReport(2023, 6);
        const label = report.getMonthLabel();
        expect(label).toContain('Juni');
      });

      it('returns January label in German', () => {
        const report = makeReport(2023, 1);
        const label = report.getMonthLabel();
        expect(label).toContain('Januar');
      });
    });

    describe('filterArrivals', () => {
      it('includes arrivals with paymentMethod and non-pending status', () => {
        const report = makeReport(2023, 6);
        const snapshot = makeArrivalsSnapshot([
          {
            date: '2023-06-01', time: '10:00',
            paymentMethod: {method: 'invoice', status: 'paid', invoiceRecipientName: 'TestCo'},
          },
        ]);
        expect(report.filterArrivals(snapshot)).toHaveLength(1);
      });

      it('excludes arrivals with status === pending', () => {
        const report = makeReport(2023, 6);
        const snapshot = makeArrivalsSnapshot([
          {
            date: '2023-06-01', time: '10:00',
            paymentMethod: {method: 'invoice', status: 'pending'},
          },
        ]);
        expect(report.filterArrivals(snapshot)).toHaveLength(0);
      });

      it('excludes arrivals without paymentMethod', () => {
        const report = makeReport(2023, 6);
        const snapshot = makeArrivalsSnapshot([
          {date: '2023-06-01', time: '10:00'},
        ]);
        expect(report.filterArrivals(snapshot)).toHaveLength(0);
      });

      it('handles empty snapshot', () => {
        const report = makeReport(2023, 6);
        const snapshot = {forEach: () => {}};
        expect(report.filterArrivals(snapshot)).toHaveLength(0);
      });

      it('includes multiple valid arrivals', () => {
        const report = makeReport(2023, 6);
        const snapshot = makeArrivalsSnapshot([
          {
            date: '2023-06-01', time: '10:00',
            paymentMethod: {method: 'invoice', status: 'paid', invoiceRecipientName: 'A'},
          },
          {
            date: '2023-06-02', time: '11:00',
            paymentMethod: {method: 'checkout', status: 'paid'},
          },
        ]);
        expect(report.filterArrivals(snapshot)).toHaveLength(2);
      });
    });

    describe('groupArrivalsByRecipient', () => {
      it('groups invoice arrivals by invoiceRecipientName', () => {
        const report = makeReport(2023, 6);
        const localArrivals = [
          {
            date: '2023-06-01', time: '10:00',
            paymentMethod: {method: 'invoice', invoiceRecipientName: 'Company A'},
          },
          {
            date: '2023-06-02', time: '11:00',
            paymentMethod: {method: 'invoice', invoiceRecipientName: 'Company A'},
          },
          {
            date: '2023-06-03', time: '12:00',
            paymentMethod: {method: 'invoice', invoiceRecipientName: 'Company B'},
          },
        ];
        const groups = report.groupArrivalsByRecipient(localArrivals);
        expect(groups['Company A']).toHaveLength(2);
        expect(groups['Company B']).toHaveLength(1);
      });

      it('groups checkout arrivals under CHECKOUT_RECIPIENT_NAME', () => {
        const report = makeReport(2023, 6);
        const localArrivals = [{
          paymentMethod: {method: 'checkout'},
        }];
        const groups = report.groupArrivalsByRecipient(localArrivals);
        const keys = Object.keys(groups);
        expect(keys).toHaveLength(1);
        // The key is the i18n online payments label (Online-Zahlungen)
        expect(keys[0]).toBe('Online-Zahlungen');
        expect(groups[keys[0]]).toHaveLength(1);
      });

      it('ignores arrivals with unsupported payment method (cash)', () => {
        const report = makeReport(2023, 6);
        const localArrivals = [{
          paymentMethod: {method: 'cash'},
        }];
        const groups = report.groupArrivalsByRecipient(localArrivals);
        expect(Object.keys(groups)).toHaveLength(0);
      });

      it('handles empty arrivals array', () => {
        const report = makeReport(2023, 6);
        expect(report.groupArrivalsByRecipient([])).toEqual({});
      });
    });

    describe('groupCustomsDeclarationsByRecipient', () => {
      it('groups by invoiceRecipientName', () => {
        const report = makeReport(2023, 6);
        const declarations = [
          {invoiceRecipientName: 'Company A', date: '2023-06-01'},
          {invoiceRecipientName: 'Company A', date: '2023-06-02'},
          {invoiceRecipientName: 'Company B', date: '2023-06-03'},
        ];
        const groups = report.groupCustomsDeclarationsByRecipient(declarations);
        expect(groups['Company A']).toHaveLength(2);
        expect(groups['Company B']).toHaveLength(1);
      });

      it('handles empty declarations array', () => {
        const report = makeReport(2023, 6);
        expect(report.groupCustomsDeclarationsByRecipient([])).toEqual({});
      });
    });

    describe('addLandingFeesTable', () => {
      it('does not push to content when arrivals is empty', () => {
        const report = makeReport(2023, 6);
        const content = [];
        report.addLandingFeesTable('Test', [], content);
        expect(content).toHaveLength(0);
      });

      it('does not push to content when arrivals is undefined', () => {
        const report = makeReport(2023, 6);
        const content = [];
        report.addLandingFeesTable('Test', undefined, content);
        expect(content).toHaveLength(0);
      });

      it('pushes subheader and table when arrivals present with feeTotalGross', () => {
        const report = makeReport(2023, 6);
        const content = [];
        const arrivals = [{
          date: '2023-06-01',
          time: '10:00',
          immatriculation: 'HB-KOF',
          mtow: 750,
          firstname: 'Max',
          lastname: 'Muster',
          email: 'max@example.com',
          flightType: 'private',
          feeTotalNet: 14.50,
          feeVat: 1.20,
          feeRoundingDifference: 0.30,
          feeTotalGross: 16.00,
        }];
        report.addLandingFeesTable('Test', arrivals, content);
        expect(content).toHaveLength(2);
        expect(content[0].style).toBe('subHeader');
        expect(content[1]).toHaveProperty('table');
      });

      it('uses landingFeeTotal as fallback when feeTotalGross is not a number', () => {
        const report = makeReport(2023, 6);
        const content = [];
        const arrivals = [{
          date: '2023-06-01',
          time: '10:00',
          immatriculation: 'HB-KOF',
          mtow: 750,
          firstname: 'Max',
          lastname: 'Muster',
          email: 'max@example.com',
          flightType: 'private',
          landingFeeTotal: 20.00,
          // feeTotalGross intentionally absent
        }];
        report.addLandingFeesTable('Test', arrivals, content);
        expect(content).toHaveLength(2);
        // Table: header row + 1 data row + 1 sum row
        expect(content[1].table.body).toHaveLength(3);
      });

      it('table has 12 columns (header row)', () => {
        const report = makeReport(2023, 6);
        const content = [];
        const arrivals = [{
          date: '2023-06-01', time: '10:00',
          immatriculation: 'HB-KOF', mtow: 750,
          firstname: 'Max', lastname: 'Muster', email: 'max@example.com',
          flightType: 'private',
          feeTotalNet: 10, feeVat: 1, feeRoundingDifference: 0, feeTotalGross: 11,
        }];
        report.addLandingFeesTable('Test', arrivals, content);
        const headerRow = content[1].table.body[0];
        expect(headerRow).toHaveLength(12);
      });

      it('accumulates sums from multiple arrivals', () => {
        const report = makeReport(2023, 6);
        const content = [];
        const arrivals = [
          {
            date: '2023-06-01', time: '10:00',
            immatriculation: 'HB-KOF', mtow: 750,
            firstname: 'Max', lastname: 'Muster', email: 'max@example.com',
            flightType: 'private',
            feeTotalNet: 10, feeVat: 1, feeRoundingDifference: 0, feeTotalGross: 11,
          },
          {
            date: '2023-06-02', time: '11:00',
            immatriculation: 'HB-ZZZ', mtow: 750,
            firstname: 'Jane', lastname: 'Doe', email: 'jane@example.com',
            flightType: 'private',
            feeTotalNet: 20, feeVat: 2, feeRoundingDifference: 0, feeTotalGross: 22,
          },
        ];
        report.addLandingFeesTable('Test', arrivals, content);
        const table = content[1].table.body;
        // header + 2 data rows + 1 sum row
        expect(table).toHaveLength(4);
        // Sum row total gross = 11 + 22 = 33
        const sumRow = table[3];
        expect(sumRow[11].text).toBe('33.00');
      });
    });

    describe('addCustomsFeesTable', () => {
      it('does not push to content when no relevant declarations', () => {
        const report = makeReport(2023, 6);
        const content = [];
        report.addCustomsFeesTable('Test', [], content, false);
        expect(content).toHaveLength(0);
      });

      it('does not push to content when declarations is undefined', () => {
        const report = makeReport(2023, 6);
        const content = [];
        report.addCustomsFeesTable('Test', undefined, content, false);
        expect(content).toHaveLength(0);
      });

      it('filters out cancelled=true entries when cancelled=false', () => {
        const report = makeReport(2023, 6);
        const content = [];
        const declarations = [
          {
            date: '2023-06-01', registration: 'HB-KOF', email: 'a@b.com',
            direction: 'arrival',
            fee: {totalNet: 10, vat: 1, roundingDifference: 0, totalGrossRounded: 11},
            cancelled: true,
          },
          {
            date: '2023-06-02', registration: 'HB-KOF', email: 'a@b.com',
            direction: 'arrival',
            fee: {totalNet: 10, vat: 1, roundingDifference: 0, totalGrossRounded: 11},
          },
        ];
        report.addCustomsFeesTable('Test', declarations, content, false);
        expect(content).toHaveLength(2); // only the non-cancelled one processed
        const tableBody = content[1].table.body;
        // header + 1 data row + 1 sum row
        expect(tableBody).toHaveLength(3);
      });

      it('filters out non-cancelled entries when cancelled=true', () => {
        const report = makeReport(2023, 6);
        const content = [];
        const declarations = [
          {
            date: '2023-06-01', registration: 'HB-KOF', email: 'a@b.com',
            direction: 'arrival',
            fee: {totalNet: 10, vat: 1, roundingDifference: 0, totalGrossRounded: 11},
            cancelled: true,
          },
          {
            date: '2023-06-02', registration: 'HB-KOF', email: 'a@b.com',
            direction: 'arrival',
            fee: {totalNet: 10, vat: 1, roundingDifference: 0, totalGrossRounded: 11},
          },
        ];
        report.addCustomsFeesTable('Test', declarations, content, true);
        expect(content).toHaveLength(2);
        const tableBody = content[1].table.body;
        expect(tableBody).toHaveLength(3);
      });

      it('uses cancelled subheader text when cancelled=true', () => {
        const report = makeReport(2023, 6);
        const content = [];
        const declarations = [{
          date: '2023-06-01', registration: 'HB-KOF', email: 'a@b.com',
          direction: 'arrival',
          fee: {totalNet: 10, vat: 1, roundingDifference: 0, totalGrossRounded: 11},
          cancelled: true,
        }];
        report.addCustomsFeesTable('Test', declarations, content, true);
        expect(content[0].text).toContain('ANNULLIERT');
      });

      it('uses normal subheader text when cancelled=false', () => {
        const report = makeReport(2023, 6);
        const content = [];
        const declarations = [{
          date: '2023-06-01', registration: 'HB-KOF', email: 'a@b.com',
          direction: 'arrival',
          fee: {totalNet: 10, vat: 1, roundingDifference: 0, totalGrossRounded: 11},
        }];
        report.addCustomsFeesTable('Test', declarations, content, false);
        expect(content[0].text).not.toContain('ANNULLIERT');
      });

      it('handles object-style fee with all sub-fields', () => {
        const report = makeReport(2023, 6);
        const content = [];
        const declarations = [{
          date: '2023-06-01',
          registration: 'HB-KOF',
          email: 'max@example.com',
          direction: 'arrival',
          fee: {totalNet: 10, vat: 1.1, roundingDifference: -0.1, totalGrossRounded: 11},
        }];
        report.addCustomsFeesTable('Test', declarations, content, false);
        expect(content).toHaveLength(2);
        expect(content[1]).toHaveProperty('table');
      });

      it('handles numeric fee as fallback (transition month)', () => {
        const report = makeReport(2023, 6);
        const content = [];
        const declarations = [{
          date: '2023-06-01',
          registration: 'HB-KOF',
          email: 'max@example.com',
          direction: 'departure',
          fee: 15,
        }];
        report.addCustomsFeesTable('Test', declarations, content, false);
        expect(content).toHaveLength(2);
      });

      it('sets direction label to Ausflug for departure', () => {
        const report = makeReport(2023, 6);
        const content = [];
        const declarations = [{
          date: '2023-06-01', registration: 'HB-KOF', email: 'max@example.com',
          direction: 'departure',
          fee: {totalNet: 10, vat: 1, roundingDifference: 0, totalGrossRounded: 11},
        }];
        report.addCustomsFeesTable('Test', declarations, content, false);
        const tableBody = content[1].table.body;
        const dataRow = tableBody[1];
        // direction is a plain string (i18n output, not an object with .text)
        expect(dataRow[3]).toBe('Ausflug');
      });

      it('sets direction label to Einflug for arrival', () => {
        const report = makeReport(2023, 6);
        const content = [];
        const declarations = [{
          date: '2023-06-01', registration: 'HB-KOF', email: 'max@example.com',
          direction: 'arrival',
          fee: {totalNet: 10, vat: 1, roundingDifference: 0, totalGrossRounded: 11},
        }];
        report.addCustomsFeesTable('Test', declarations, content, false);
        const tableBody = content[1].table.body;
        const dataRow = tableBody[1];
        expect(dataRow[3]).toBe('Einflug');
      });

      it('table has 8 columns (header row)', () => {
        const report = makeReport(2023, 6);
        const content = [];
        const declarations = [{
          date: '2023-06-01', registration: 'HB-KOF', email: 'max@example.com',
          direction: 'arrival',
          fee: {totalNet: 10, vat: 1, roundingDifference: 0, totalGrossRounded: 11},
        }];
        report.addCustomsFeesTable('Test', declarations, content, false);
        const headerRow = content[1].table.body[0];
        expect(headerRow).toHaveLength(8);
      });

      it('accumulates sums from multiple declarations', () => {
        const report = makeReport(2023, 6);
        const content = [];
        const declarations = [
          {
            date: '2023-06-01', registration: 'HB-KOF', email: 'a@b.com',
            direction: 'arrival',
            fee: {totalNet: 10, vat: 1, roundingDifference: 0, totalGrossRounded: 11},
          },
          {
            date: '2023-06-02', registration: 'HB-ZZZ', email: 'c@d.com',
            direction: 'departure',
            fee: {totalNet: 20, vat: 2, roundingDifference: 0, totalGrossRounded: 22},
          },
        ];
        report.addCustomsFeesTable('Test', declarations, content, false);
        const table = content[1].table.body;
        // header + 2 data rows + 1 sum row
        expect(table).toHaveLength(4);
        const sumRow = table[3];
        expect(sumRow[7].text).toBe('33.00');
      });
    });

    describe('buildContent', () => {
      it('pushes a single noRecipients item when no arrivals and no customs', () => {
        const report = makeReport(2023, 6);
        const arrivalsSnapshot = {forEach: () => {}};
        const content = report.buildContent(arrivalsSnapshot, [], []);
        // Single item pushed for the "no recipients" case
        expect(content).toHaveLength(1);
        // The item is whatever i18n.t returns (string or translated object)
        expect(content[0]).toBeDefined();
      });

      it('creates a section header for each recipient', () => {
        const report = makeReport(2023, 6);
        const arrivalsSnapshot = makeArrivalsSnapshot([
          {
            date: '2023-06-01', time: '10:00',
            immatriculation: 'HB-KOF', mtow: 750, flightType: 'private',
            firstname: 'Max', lastname: 'Muster', email: 'max@example.com',
            feeTotalNet: 14.50, feeVat: 1.20, feeRoundingDifference: 0.30, feeTotalGross: 16.00,
            paymentMethod: {method: 'invoice', status: 'paid', invoiceRecipientName: 'Company A'},
          },
        ]);
        const content = report.buildContent(arrivalsSnapshot, [], []);
        const headers = content.filter(item => item && item.style === 'header');
        // Company A + Online-Zahlungen (checkout) header should exist even with empty data
        expect(headers.length).toBeGreaterThan(0);
      });

      it('places CHECKOUT_RECIPIENT_NAME first regardless of alphabetical order', () => {
        const report = makeReport(2023, 6);
        const arrivalsSnapshot = makeArrivalsSnapshot([
          {
            date: '2023-06-01', time: '10:00',
            immatriculation: 'HB-KOF', mtow: 750, flightType: 'private',
            firstname: 'Max', lastname: 'Muster', email: 'max@example.com',
            feeTotalNet: 10, feeVat: 1, feeRoundingDifference: 0, feeTotalGross: 11,
            paymentMethod: {method: 'invoice', status: 'paid', invoiceRecipientName: 'ZZZ Company'},
          },
          {
            date: '2023-06-02', time: '11:00',
            immatriculation: 'HB-ZZZ', mtow: 750, flightType: 'private',
            firstname: 'Jane', lastname: 'Doe', email: 'jane@example.com',
            feeTotalNet: 10, feeVat: 1, feeRoundingDifference: 0, feeTotalGross: 11,
            paymentMethod: {method: 'checkout', status: 'paid'},
          },
        ]);
        const content = report.buildContent(arrivalsSnapshot, [], []);
        const firstHeader = content[0];
        expect(firstHeader.text).toContain('Online-Zahlungen');
      });

      it('adds pageBreak=before for recipients after the first', () => {
        const report = makeReport(2023, 6);
        const arrivalsSnapshot = makeArrivalsSnapshot([
          {
            date: '2023-06-01', time: '10:00',
            immatriculation: 'HB-KOF', mtow: 750, flightType: 'private',
            firstname: 'Max', lastname: 'Muster', email: 'max@example.com',
            feeTotalNet: 10, feeVat: 1, feeRoundingDifference: 0, feeTotalGross: 11,
            paymentMethod: {method: 'invoice', status: 'paid', invoiceRecipientName: 'Company A'},
          },
          {
            date: '2023-06-02', time: '10:00',
            immatriculation: 'HB-ZZZ', mtow: 750, flightType: 'private',
            firstname: 'Jane', lastname: 'Doe', email: 'jane@example.com',
            feeTotalNet: 10, feeVat: 1, feeRoundingDifference: 0, feeTotalGross: 11,
            paymentMethod: {method: 'invoice', status: 'paid', invoiceRecipientName: 'Company B'},
          },
        ]);
        const content = report.buildContent(arrivalsSnapshot, [], []);
        const headersWithPageBreak = content.filter(
          item => item && item.style === 'header' && item.pageBreak === 'before'
        );
        expect(headersWithPageBreak.length).toBeGreaterThan(0);
      });

      it('first recipient header has no pageBreak', () => {
        const report = makeReport(2023, 6);
        const arrivalsSnapshot = makeArrivalsSnapshot([
          {
            date: '2023-06-01', time: '10:00',
            immatriculation: 'HB-KOF', mtow: 750, flightType: 'private',
            firstname: 'Max', lastname: 'Muster', email: 'max@example.com',
            feeTotalNet: 10, feeVat: 1, feeRoundingDifference: 0, feeTotalGross: 11,
            paymentMethod: {method: 'invoice', status: 'paid', invoiceRecipientName: 'Company A'},
          },
        ]);
        const content = report.buildContent(arrivalsSnapshot, [], []);
        const firstHeader = content[0];
        expect(firstHeader.pageBreak).toBeUndefined();
      });

      it('includes customs declarations in content', () => {
        const report = makeReport(2023, 6);
        const arrivalsSnapshot = {forEach: () => {}};
        const customsInvoices = [
          {
            invoiceRecipientName: 'Customs Co',
            date: '2023-06-01',
            registration: 'HB-KOF',
            email: 'a@b.com',
            direction: 'arrival',
            fee: {totalNet: 10, vat: 1, roundingDifference: 0, totalGrossRounded: 11},
          },
        ];
        const content = report.buildContent(arrivalsSnapshot, customsInvoices, []);
        expect(content.length).toBeGreaterThan(1);
      });

      it('includes cancelled customs declarations in separate table', () => {
        const report = makeReport(2023, 6);
        const arrivalsSnapshot = {forEach: () => {}};
        const customsInvoices = [
          {
            invoiceRecipientName: 'Customs Co',
            date: '2023-06-01',
            registration: 'HB-KOF',
            email: 'a@b.com',
            direction: 'arrival',
            fee: {totalNet: 10, vat: 1, roundingDifference: 0, totalGrossRounded: 11},
            cancelled: true,
          },
        ];
        const content = report.buildContent(arrivalsSnapshot, customsInvoices, []);
        const cancelledHeaders = content.filter(
          item => item && item.text && item.text.toString().includes('ANNULLIERT')
        );
        expect(cancelledHeaders.length).toBeGreaterThan(0);
      });

      it('adds checkout customs to CHECKOUT_RECIPIENT_NAME section', () => {
        const report = makeReport(2023, 6);
        const arrivalsSnapshot = {forEach: () => {}};
        const customsCheckouts = [
          {
            date: '2023-06-01',
            registration: 'HB-KOF',
            email: 'a@b.com',
            direction: 'arrival',
            fee: {totalNet: 10, vat: 1, roundingDifference: 0, totalGrossRounded: 11},
          },
        ];
        const content = report.buildContent(arrivalsSnapshot, [], customsCheckouts);
        // Should have content from the Online-Zahlungen section
        expect(content.length).toBeGreaterThan(1);
        const firstHeader = content[0];
        expect(firstHeader.text).toContain('Online-Zahlungen');
      });
    });

    describe('build', () => {
      it('calls pdfMake.createPdf and callback with the pdf object', () => {
        const fakePdf = {getBase64: jest.fn()};
        pdfMake.createPdf.mockReturnValue(fakePdf);

        const report = makeReport(2023, 6);
        const arrivalsSnapshot = {forEach: () => {}};
        const callback = jest.fn();

        report.build(arrivalsSnapshot, [], [], callback);

        expect(pdfMake.createPdf).toHaveBeenCalled();
        expect(callback).toHaveBeenCalledWith(fakePdf);
      });

      it('creates PDF with landscape page orientation', () => {
        const report = makeReport(2023, 6);
        const arrivalsSnapshot = {forEach: () => {}};
        const callback = jest.fn();

        report.build(arrivalsSnapshot, [], [], callback);

        const docDefinition = pdfMake.createPdf.mock.calls[0][0];
        expect(docDefinition.pageOrientation).toBe('landscape');
      });
    });

    describe('readArrivals', () => {
      it('resolves with a firebase snapshot after querying by dateTime', () => {
        const arrivalsSnapshot = {forEach: () => {}};
        const {get} = require('firebase/database');
        get.mockResolvedValue(arrivalsSnapshot);

        const report = makeReport(2023, 6);
        return report.readArrivals().then(snapshot => {
          expect(get).toHaveBeenCalled();
          expect(snapshot).toBe(arrivalsSnapshot);
        });
      });
    });

    describe('fetchCustomsData', () => {
      it('returns parsed JSON on successful response', async () => {
        // Mock getIdToken
        const firebaseModule = require('./firebase');
        firebaseModule.getIdToken = jest.fn().mockResolvedValue('test-token');

        // Mock global fetch
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => [{invoiceRecipientName: 'TestCo'}],
        });

        global.__FIREBASE_PROJECT_ID__ = 'test-project';

        const report = makeReport(2023, 6);
        const result = await report.fetchCustomsData('invoices');
        expect(result).toEqual([{invoiceRecipientName: 'TestCo'}]);
      });

      it('throws on non-ok response', async () => {
        const firebaseModule = require('./firebase');
        firebaseModule.getIdToken = jest.fn().mockResolvedValue('test-token');

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 403,
        });

        global.__FIREBASE_PROJECT_ID__ = 'test-project';

        const report = makeReport(2023, 6);
        await expect(report.fetchCustomsData('invoices')).rejects.toThrow('Failed to fetch customs invoices');
      });
    });

    describe('readCustomsDeclarationsInvoices', () => {
      it('calls fetchCustomsData with invoices endpoint', async () => {
        const report = makeReport(2023, 6);
        report.fetchCustomsData = jest.fn().mockResolvedValue([]);
        await report.readCustomsDeclarationsInvoices();
        expect(report.fetchCustomsData).toHaveBeenCalledWith('invoices');
      });
    });

    describe('readCustomsDeclarationsCheckouts', () => {
      it('calls fetchCustomsData with checkouts endpoint', async () => {
        const report = makeReport(2023, 6);
        report.fetchCustomsData = jest.fn().mockResolvedValue([]);
        await report.readCustomsDeclarationsCheckouts();
        expect(report.fetchCustomsData).toHaveBeenCalledWith('checkouts');
      });
    });

    describe('generate', () => {
      it('calls callback with a pdf after fetching all data', () => {
        const arrivalsSnapshot = {forEach: () => {}};
        const {get} = require('firebase/database');
        get.mockResolvedValue(arrivalsSnapshot);

        const fakePdf = {getBase64: jest.fn()};
        pdfMake.createPdf.mockReturnValue(fakePdf);

        const report = makeReport(2023, 6);
        // Stub customs data methods to resolve immediately
        report.readCustomsDeclarationsInvoices = jest.fn().mockResolvedValue([]);
        report.readCustomsDeclarationsCheckouts = jest.fn().mockResolvedValue([]);

        return new Promise(resolve => {
          report.generate((pdf) => {
            expect(pdf).toBe(fakePdf);
            resolve();
          });
        });
      });
    });
  });
});
