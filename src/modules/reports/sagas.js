import { takeEvery } from 'redux-saga';
import { fork, call, put, select } from 'redux-saga/effects';
import moment from 'moment';
import * as actions from './actions';
import { airstat, landings } from '../../util/report';

export const selectReport = report => state => state.reports[report];

function generate(report, startDate, endDate, options) {
  switch (report) {
    case 'airstat':
      return airstat(startDate, endDate, options);
    case 'landings':
      return landings(startDate, endDate, options);
    default:
      throw new Error('Unknown report ' + report);
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
  const month = state.date.month < 10 ? '0' + state.date.month : state.date.month;
  const day = '01';

  const startDate = year + '-' + month + '-' + day;
  const endDate = moment(startDate).endOf('month').format('YYYY-MM-DD');

  const download = yield call(generate, report, startDate, endDate, state.parameters);

  yield put(actions.setReportGenerationInProgress(report, false));

  yield call(startDownload, download);
}

export default function* sagas() {
  yield [
    fork(takeEvery, actions.GENERATE_REPORT, generateReport),
  ]
}
