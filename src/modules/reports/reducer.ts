import moment from 'moment';
import * as actions from './actions';
import { ReportsAction, ReportDate } from './actions';
import reducer from '../../util/reducer';

interface ReportItem {
  date: ReportDate;
  parameters: Record<string, unknown>;
  generationInProgress?: boolean;
}

interface ReportsState {
  [reportName: string]: ReportItem;
}

const INITIAL_STATE: ReportsState = {};

function initReport(state: ReportsState, action: ReportsAction & { type: typeof actions.INIT_REPORT }) {
  const date = moment().subtract(1, 'month');
  return Object.assign({}, state, {
    [action.payload.name]: {
      date: {
        year: date.year(),
        month: date.month() + 1,
      },
      parameters: {},
    },
  });
}

function setReportDate(state: ReportsState, action: ReportsAction & { type: typeof actions.SET_REPORT_DATE }) {
  const { report, date } = action.payload;

  const newReportObj = Object.assign({}, state[report], {
    date,
  });
  return Object.assign({}, state, {
    [report]: newReportObj,
  });
}

function setReportParameter(state: ReportsState, action: ReportsAction & { type: typeof actions.SET_REPORT_PARAMETER }) {
  const { report, parameterName, parameterValue } = action.payload;
  const reportObj = state[report];

  const newParamsObj = Object.assign({}, reportObj.parameters, {
    [parameterName]: parameterValue,
  });
  const newReportObj = Object.assign({}, reportObj, {
    parameters: newParamsObj,
  });
  return Object.assign({}, state, {
    [report]: newReportObj,
  });
}

function setReportGenerationInProgress(state: ReportsState, action: ReportsAction & { type: typeof actions.SET_REPORT_GENERATION_IN_PROGRESS }) {
  const { report, inProgress } = action.payload;

  const newReportObj = Object.assign({}, state[report], {
    generationInProgress: inProgress,
  });
  return Object.assign({}, state, {
    [report]: newReportObj,
  });
}

const ACTION_HANDLERS = {
  [actions.INIT_REPORT]: initReport,
  [actions.SET_REPORT_DATE]: setReportDate,
  [actions.SET_REPORT_PARAMETER]: setReportParameter,
  [actions.SET_REPORT_GENERATION_IN_PROGRESS]: setReportGenerationInProgress,
};

export type { ReportsState };
export default reducer<ReportsState, ReportsAction>(INITIAL_STATE, ACTION_HANDLERS);
