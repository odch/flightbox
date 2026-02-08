import {all, call, put, select, takeEvery} from 'redux-saga/effects';
import * as actions from './actions';
import {airstat, invoices, landings, yearlySummary} from '../../util/report';

export const selectReport = report => state => state.reports[report];

function* generate(report, year, month, options) {
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
      const invoicesResult = yield call(invoices, year, month, options)
      return pdf(
        `invoice_recipients_${year}_${month}.pdf`,
        invoicesResult
      )
    default:
      throw new Error('Unknown report ' + report);
  }
}

function csv(result) {
    return {
      type: 'csv',
      result
    }
}

function pdf(filename, result) {
  return {
    type: 'pdf',
    filename,
    result
  }
}

function* startDownload(download) {
  download.start();
}

export function* generateReport(action) {
  const report = action.payload.report;

  yield put(actions.setReportGenerationInProgress(report, true));

  const state = yield select(selectReport(report));

  const year = state.date.year;
  const month = state.date.month;

  const download = yield call(generate, report, year, month, state.parameters);

  yield put(actions.setReportGenerationInProgress(report, false));

  if (download.type === 'csv') {
    yield call(startDownload, download.result);
  } else if (download.type === 'pdf') {
    download.result.download(download.filename)
  } else {
    throw new Error('Unsupported type ' + download.type)
  }
}

export default function* sagas() {
  yield all([
    takeEvery(actions.GENERATE_REPORT, generateReport),
  ])
}
