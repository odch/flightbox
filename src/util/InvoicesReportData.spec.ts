describe('util', () => {
  describe('InvoicesReportData', () => {
    let InvoicesReportData;
    let get;

    beforeEach(() => {
      global.__CONF__ = {
        aerodrome: {
          ICAO: 'LSZT',
          runways: [{name: '10', type: 'A'}, {name: '28', type: 'A'}],
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

      get = require('firebase/database').get;
      InvoicesReportData = require('./InvoicesReportData').default;
    });

    function makeArrivalsSnapshot(arrivals) {
      const records = arrivals.map(arrival => ({
        val: () => ({
          dateTime: new Date(`${arrival.date}T${arrival.time}:00`).toISOString(),
          immatriculation: 'HB-KOF',
          paymentMethod: arrival.paymentMethod,
        }),
      }));
      return {forEach: fn => records.forEach(fn)};
    }

    // collect() is the wiring InvoicesExcelReport.generate() actually calls in
    // production: readArrivals + the two customs endpoints, fed into groupAll.
    // Nothing else exercises it end to end.
    describe('collect', () => {
      it('fetches arrivals and customs data and groups them by recipient', async () => {
        get.mockResolvedValue(makeArrivalsSnapshot([
          {
            date: '2023-06-01', time: '10:00',
            paymentMethod: {method: 'invoice', status: 'paid', invoiceRecipientName: 'Company A'},
          },
          {
            date: '2023-06-02', time: '11:00',
            paymentMethod: {method: 'checkout', status: 'paid'},
          },
        ]));

        const report = new InvoicesReportData(2023, 6);
        report.readCustomsDeclarationsInvoices = jest.fn().mockResolvedValue([
          {invoiceRecipientName: 'Company A', date: '2023-06-01', fee: 10},
        ]);
        report.readCustomsDeclarationsCheckouts = jest.fn().mockResolvedValue([
          {date: '2023-06-03', fee: 5},
        ]);

        const {recipientNames, arrivalRecipients, customsRecipients} = await report.collect();

        expect(recipientNames).toEqual(['Online-Zahlungen', 'Company A']);
        expect(arrivalRecipients['Company A']).toHaveLength(1);
        expect(customsRecipients['Company A']).toHaveLength(1);
        // The checkout customs declarations are filed under the same recipient
        // name as checkout arrivals.
        expect(customsRecipients['Online-Zahlungen']).toHaveLength(1);
      });

      it('excludes pending arrivals, matching the PDF report', async () => {
        get.mockResolvedValue(makeArrivalsSnapshot([
          {
            date: '2023-06-01', time: '10:00',
            paymentMethod: {method: 'invoice', status: 'pending', invoiceRecipientName: 'Company A'},
          },
        ]));

        const report = new InvoicesReportData(2023, 6);
        report.readCustomsDeclarationsInvoices = jest.fn().mockResolvedValue([]);
        report.readCustomsDeclarationsCheckouts = jest.fn().mockResolvedValue([]);

        const {recipientNames, arrivalRecipients} = await report.collect();

        // The checkout recipient placeholder is always present (it carries the
        // customs checkouts group even when there are none); the pending
        // arrival's recipient must not be.
        expect(recipientNames).toEqual(['Online-Zahlungen']);
        expect(arrivalRecipients['Company A']).toBeUndefined();
      });

      it('rejects when a customs endpoint fails', async () => {
        get.mockResolvedValue(makeArrivalsSnapshot([]));

        const report = new InvoicesReportData(2023, 6);
        report.readCustomsDeclarationsInvoices = jest.fn().mockRejectedValue(new Error('down'));
        report.readCustomsDeclarationsCheckouts = jest.fn().mockResolvedValue([]);

        await expect(report.collect()).rejects.toThrow('down');
      });
    });
  });
});
