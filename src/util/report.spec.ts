global.__CONF__ = {
  aerodrome: {
    ICAO: 'LSZT',
    runways: [{name: '10', type: 'A'}, {name: '28', type: 'A'}],
  },
  enabledFlightTypes: {0: 'private', 1: 'instruction'},
  memberManagement: false,
};

// invoicesExcel is a thin wrapper, but it is the one place that forwards
// (year, month, options) into the InvoicesExcelReport constructor — nothing
// else in the suite goes through this file, so an argument-order slip here
// (e.g. swapping year/month) would otherwise go uncaught.
jest.mock('./InvoicesExcelReport', () => {
  const construct = jest.fn();
  const MockInvoicesExcelReport = jest.fn().mockImplementation(function (this: any, ...args: any[]) {
    construct(...args);
    this.generate = jest.fn().mockResolvedValue('the-blob');
  });
  (MockInvoicesExcelReport as any).__construct = construct;
  return {__esModule: true, default: MockInvoicesExcelReport};
});

describe('util', () => {
  describe('report', () => {
    describe('invoicesExcel', () => {
      it('forwards year, month and options to InvoicesExcelReport and resolves with its result', async () => {
        const {invoicesExcel} = require('./report');
        const InvoicesExcelReport = require('./InvoicesExcelReport').default;
        const options = {format: 'excel'};

        const result = await invoicesExcel(2024, 11, options);

        expect((InvoicesExcelReport as any).__construct).toHaveBeenCalledWith(2024, 11, options);
        expect(result).toBe('the-blob');
      });

      it('propagates a rejection instead of swallowing it', async () => {
        const InvoicesExcelReport = require('./InvoicesExcelReport').default;
        InvoicesExcelReport.mockImplementationOnce(function (this: any) {
          this.generate = jest.fn().mockRejectedValue(new Error('failed'));
        });
        const {invoicesExcel} = require('./report');

        await expect(invoicesExcel(2024, 11, {})).rejects.toThrow('failed');
      });
    });
  });
});
