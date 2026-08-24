import {call, put, select} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';

jest.mock('../../util/report', () => ({
  airstat: jest.fn(),
  invoices: jest.fn(),
  invoicesExcel: jest.fn(),
  landings: jest.fn(),
  yearlySummary: jest.fn(),
}));

jest.mock('../../util/downloadBlob', () => jest.fn());

describe('modules', () => {
  describe('reports', () => {
    describe('sagas', () => {
      describe('selectReport', () => {
        it('should select the correct report from state', () => {
          const state = {
            reports: {
              airstat: {date: {year: 2024, month: 11}, parameters: {}}
            }
          };
          expect(sagas.selectReport('airstat')(state)).toEqual(state.reports.airstat);
        });
      });

      describe('generateReport (csv path - airstat)', () => {
        it('should generate and download a csv report', () => {
          const report = 'airstat';
          const action = actions.generateReport(report);
          const generator = sagas.generateReport(action);

          expect(generator.next().value).toEqual(
            put(actions.setReportGenerationInProgress(report, true))
          );

          const selectEffect = generator.next().value;
          const state = {reports: {airstat: {date: {year: 2024, month: 11}, parameters: {}}}};
          expect((selectEffect as any).payload.selector(state)).toEqual(state.reports.airstat);

          const reportState = {
            date: {year: 2024, month: 11},
            parameters: {includeInactive: false}
          };

          const downloadResult = {start: jest.fn()};
          const download = {type: 'csv', result: downloadResult};

          expect(generator.next(reportState).value).toMatchObject({
            type: 'CALL'
          });

          expect(generator.next(download).value).toEqual(
            put(actions.setReportGenerationInProgress(report, false))
          );

          expect(generator.next().value).toMatchObject({
            type: 'CALL'
          });

          expect(generator.next().done).toEqual(true);
        });
      });

      describe('generateReport (pdf path - invoices)', () => {
        it('should generate and download a pdf report', () => {
          const report = 'invoices';
          const action = actions.generateReport(report);
          const generator = sagas.generateReport(action);

          expect(generator.next().value).toEqual(
            put(actions.setReportGenerationInProgress(report, true))
          );

          const selectEffect = generator.next().value;
          const state = {
            reports: {
              invoices: {date: {year: 2024, month: 11}, parameters: {}}
            }
          };
          expect((selectEffect as any).payload.selector(state)).toEqual(state.reports.invoices);

          const reportState = {
            date: {year: 2024, month: 11},
            parameters: {}
          };

          const pdfResult = {download: jest.fn()};
          const download = {
            type: 'pdf',
            filename: 'invoice_recipients_2024_11.pdf',
            result: pdfResult
          };

          expect(generator.next(reportState).value).toMatchObject({
            type: 'CALL'
          });

          expect(generator.next(download).value).toEqual(
            put(actions.setReportGenerationInProgress(report, false))
          );

          const {value, done} = generator.next();
          expect(done).toEqual(true);
          expect(pdfResult.download).toHaveBeenCalledWith('invoice_recipients_2024_11.pdf');
        });
      });

      describe('generateReport (xlsx path - invoices)', () => {
        it('should generate and download an xlsx report when format is excel', () => {
          const report = 'invoices';
          const action = actions.generateReport(report);
          const generator = sagas.generateReport(action);

          expect(generator.next().value).toEqual(
            put(actions.setReportGenerationInProgress(report, true))
          );

          // select
          generator.next();

          const reportState = {
            date: {year: 2024, month: 11},
            parameters: {format: 'excel'}
          };

          const blob = {size: 1234};
          const download = {
            type: 'xlsx',
            filename: 'invoice_recipients_2024_11.xlsx',
            result: blob
          };

          expect(generator.next(reportState).value).toMatchObject({
            type: 'CALL'
          });

          expect(generator.next(download).value).toEqual(
            put(actions.setReportGenerationInProgress(report, false))
          );

          const downloadEffect = generator.next().value;
          expect(downloadEffect).toMatchObject({type: 'CALL'});
          expect((downloadEffect as any).payload.args).toEqual([
            'invoice_recipients_2024_11.xlsx',
            blob
          ]);

          expect(generator.next().done).toEqual(true);
        });

        it('drives the inner generator to an xlsx descriptor for format=excel', () => {
          // The two tests above simulate generate()'s return value; this one
          // actually runs generate()'s switch/case to the end, so the filename
          // template and the excel/pdf branch choice are genuinely exercised.
          const {invoices, invoicesExcel} = require('../../util/report');
          const blob = {size: 1};
          const generator = sagas.generateReport(actions.generateReport('invoices'));

          generator.next();
          generator.next();

          const callEffect = generator.next({
            date: {year: 2024, month: 11},
            parameters: {format: 'excel'}
          }).value;

          const inner = (callEffect as any).payload.fn(
            'invoices', 2024, 11, {format: 'excel'}
          );
          const innerCallEffect = inner.next().value;
          expect(innerCallEffect.payload.fn).toBe(invoicesExcel);
          expect(innerCallEffect.payload.args).toEqual([2024, 11, {format: 'excel'}]);

          const {value: result, done} = inner.next(blob);
          expect(done).toBe(true);
          expect(result).toEqual({
            type: 'xlsx',
            filename: 'invoice_recipients_2024_11.xlsx',
            result: blob
          });
          expect(invoices).not.toHaveBeenCalled();
        });

        it('drives the inner generator to a pdf descriptor when no format is set', () => {
          const {invoices, invoicesExcel} = require('../../util/report');
          const pdfResult = {download: jest.fn()};
          const generator = sagas.generateReport(actions.generateReport('invoices'));

          generator.next();
          generator.next();

          const callEffect = generator.next({
            date: {year: 2024, month: 11},
            parameters: {}
          }).value;

          const inner = (callEffect as any).payload.fn('invoices', 2024, 11, {});
          const innerCallEffect = inner.next().value;
          expect(innerCallEffect.payload.fn).toBe(invoices);

          const {value: result, done} = inner.next(pdfResult);
          expect(done).toBe(true);
          expect(result).toEqual({
            type: 'pdf',
            filename: 'invoice_recipients_2024_11.pdf',
            result: pdfResult
          });
          expect(invoicesExcel).not.toHaveBeenCalled();
        });
      });

      describe('generateReport (failure)', () => {
        it('clears the in-progress flag when generation fails', () => {
          const report = 'invoices';
          const generator = sagas.generateReport(actions.generateReport(report));

          expect(generator.next().value).toEqual(
            put(actions.setReportGenerationInProgress(report, true))
          );

          // select
          generator.next();

          // generate call
          generator.next({date: {year: 2024, month: 11}, parameters: {format: 'excel'}});

          // A failure must not leave the form disabled forever.
          expect(generator.throw(new Error('customs down')).value).toEqual(
            put(actions.setReportGenerationInProgress(report, false))
          );

          expect(() => generator.next()).toThrow('customs down');
        });
      });

      describe('generateReport (csv path - landings)', () => {
        it('should generate and download a landings csv report', () => {
          const report = 'landings';
          const action = actions.generateReport(report);
          const generator = sagas.generateReport(action);

          expect(generator.next().value).toEqual(
            put(actions.setReportGenerationInProgress(report, true))
          );

          // select
          generator.next();

          const reportState = {
            date: {year: 2024, month: 5},
            parameters: {option: true}
          };

          const downloadResult = {start: jest.fn()};
          const download = {type: 'csv', result: downloadResult};

          // generate call
          expect(generator.next(reportState).value).toMatchObject({type: 'CALL'});

          expect(generator.next(download).value).toEqual(
            put(actions.setReportGenerationInProgress(report, false))
          );

          // startDownload call
          expect(generator.next().value).toMatchObject({type: 'CALL'});

          expect(generator.next().done).toEqual(true);
        });
      });

      describe('generateReport (csv path - yearlySummary)', () => {
        it('should generate and download a yearlySummary csv report', () => {
          const report = 'yearlySummary';
          const action = actions.generateReport(report);
          const generator = sagas.generateReport(action);

          expect(generator.next().value).toEqual(
            put(actions.setReportGenerationInProgress(report, true))
          );

          // select
          generator.next();

          const reportState = {
            date: {year: 2024, month: null},
            parameters: {}
          };

          const downloadResult = {start: jest.fn()};
          const download = {type: 'csv', result: downloadResult};

          // generate call
          expect(generator.next(reportState).value).toMatchObject({type: 'CALL'});

          expect(generator.next(download).value).toEqual(
            put(actions.setReportGenerationInProgress(report, false))
          );

          // startDownload call
          expect(generator.next().value).toMatchObject({type: 'CALL'});

          expect(generator.next().done).toEqual(true);
        });
      });
    });
  });
});
