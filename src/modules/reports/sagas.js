import { takeEvery } from 'redux-saga';
import { fork, call, put, select } from 'redux-saga/effects';
import moment from 'moment';
import * as actions from './actions';
import { airstat, landings, yearlySummary } from '../../util/report';

export const selectReport = report => state => state.reports[report];

function generate(report, year, month, options) {
  switch (report) {
    case 'airstat':
      return airstat(year, month, options);
    case 'landings':
      return landings(year, month, options);
    case 'yearlySummary':
      return yearlySummary(year);
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
  const month = state.date.month;

  const download = yield call(generate, report, year, month, state.parameters);

  yield put(actions.setReportGenerationInProgress(report, false));

  yield call(startDownload, download);
}

export default function* sagas() {
  yield [
    fork(takeEvery, actions.GENERATE_REPORT, generateReport),
  ]
}
