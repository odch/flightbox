export const INIT_REPORT = 'INIT_REPORT';
export const SET_REPORT_DATE = 'SET_REPORT_DATE';
export const SET_REPORT_PARAMETER = 'SET_REPORT_PARAMETER';
export const GENERATE_REPORT = 'GENERATE_REPORT';
export const SET_REPORT_GENERATION_IN_PROGRESS = 'SET_REPORT_GENERATION_IN_PROGRESS';

export function initReport(name) {
  return {
    type: INIT_REPORT,
    payload: {
      name,
    },
  };
}

export function setReportDate(report, date) {
  return {
    type: SET_REPORT_DATE,
    payload: {
      report,
      date,
    },
  };
}

export function setReportParameter(report, parameterName, parameterValue) {
  return {
    type: SET_REPORT_PARAMETER,
    payload: {
      report,
      parameterName,
      parameterValue,
    },
  };
}

export function generateReport(report) {
  return {
    type: GENERATE_REPORT,
    payload: {
      report,
    },
  };
}

export function setReportGenerationInProgress(report, inProgress) {
  return {
    type: SET_REPORT_GENERATION_IN_PROGRESS,
    payload: {
      report,
      inProgress,
    },
  };
}
