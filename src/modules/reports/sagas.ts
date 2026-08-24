import {all, call, put, select, takeEvery} from 'redux-saga/effects';
import * as actions from './actions';
import {airstat, invoices, invoicesExcel, landings, yearlySummary} from '../../util/report';
import downloadBlob from '../../util/downloadBlob';

export const selectReport = (report: string) => (state: any) => state.reports[report];

function* generate(report: string, year: number, month: number, options: unknown) {
  switch (report) {
    case 'airstat':
      const airstatResult = yield call(airstat, year, month, options)
      return csv(airstatResult);
    case 'landings':
      const landingsResult = yield call(landings, year, month, options)
      return csv(landingsResult);
    case 'yearlySummary':
      const yearlySummaryResult = yield call(yearlySummary, year, options)
      return csv(yearlySummaryResult);
    case 'invoices':
      if ((options as any)?.format === 'excel') {
        const invoicesExcelResult = yield call(invoicesExcel, year, month, options)
        return xlsx(
          `invoice_recipients_${year}_${month}.xlsx`,
          invoicesExcelResult
        )
      }
      const invoicesResult = yield call(invoices, year, month, options)
      return pdf(
        `invoice_recipients_${year}_${month}.pdf`,
        invoicesResult
      )
    default:
      throw new Error('Unknown report ' + report);
  }
}

function csv(result: unknown) {
  return {
    type: 'csv',
    result
  }
}

function pdf(filename: string, result: unknown) {
  return {
    type: 'pdf',
    filename,
    result
  }
}

function xlsx(filename: string, result: unknown) {
  return {
    type: 'xlsx',
    filename,
    result
  }
}

function* startDownload(download: any) {
  download.start();
}

export function* generateReport(action: any) {
  const report = action.payload.report;

  yield put(actions.setReportGenerationInProgress(report, true));

  const state = yield select(selectReport(report));

  const year = state.date.year;
  const month = state.date.month;

  let download;
  try {
    download = yield call(generate, report, year, month, state.parameters);
  } finally {
    // Always clear the flag: a failed report must not leave the form disabled.
    yield put(actions.setReportGenerationInProgress(report, false));
  }

  if (download.type === 'csv') {
    yield call(startDownload, download.result);
  } else if (download.type === 'pdf') {
    download.result.download(download.filename)
  } else if (download.type === 'xlsx') {
    yield call(downloadBlob, download.filename, download.result)
  } else {
    throw new Error('Unsupported type ' + download.type)
  }
}

export default function* sagas() {
  yield all([
    takeEvery(actions.GENERATE_REPORT, generateReport),
  ])
}
