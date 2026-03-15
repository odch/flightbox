import {call, put, select} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';

jest.mock('../../util/report', () => ({
  airstat: jest.fn(),
  invoices: jest.fn(),
  landings: jest.fn(),
  yearlySummary: jest.fn(),
}));

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
