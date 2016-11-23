import moment from 'moment';
import * as actions from './actions';
import reducer from '../../util/reducer';

const INITIAL_STATE = {};

function initReport(state, action) {
  return Object.assign({}, state, {
    [action.payload.name]: {
      date: moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
      parameters: {},
    },
  });
}

function setReportDate(state, action) {
  const { report, date } = action.payload;

  const newReportObj = Object.assign({}, state[report], {
    date,
  });
  return Object.assign({}, state, {
    [report]: newReportObj,
  });
}

function setReportParameter(state, action) {
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

function setReportGenerationInProgress(state, action) {
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

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
