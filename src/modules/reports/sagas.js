import { takeEvery } from 'redux-saga';
import { fork, call, put, select } from 'redux-saga/effects';
import moment from 'moment';
import * as actions from './actions';
import { airstat } from '../../util/report';

export const selectReport = report => state => state.reports[report];

function generate(report, startDate, endDate, options) {
  switch (report) {
    case 'airstat':
      return airstat(startDate, endDate, options);
    default:
      throw new Error('Unknown report ' + report);
  }
}

function* startDownload(download) {
  download.start();
}

export function* generateReport(action) {
  yield put(actions.setReportGenerationInProgress(action.payload.report, true));

  const state = yield select(selectReport('airstat'));
  const startDate = state.date;
  const endDate = moment(state.date).endOf('month').format('YYYY-MM-DD');

  const download = yield call(generate, action.payload.report, startDate, endDate, state.parameters);

  yield put(actions.setReportGenerationInProgress(action.payload.report, false));

  yield call(startDownload, download);
}

export default function* sagas() {
  yield [
    fork(takeEvery, actions.GENERATE_REPORT, generateReport),
  ]
}
