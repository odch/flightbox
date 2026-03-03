export const INIT_REPORT = 'INIT_REPORT' as const;
export const SET_REPORT_DATE = 'SET_REPORT_DATE' as const;
export const SET_REPORT_PARAMETER = 'SET_REPORT_PARAMETER' as const;
export const GENERATE_REPORT = 'GENERATE_REPORT' as const;
export const SET_REPORT_GENERATION_IN_PROGRESS = 'SET_REPORT_GENERATION_IN_PROGRESS' as const;

export interface ReportDate {
  year: number;
  month: number;
}

export type ReportsAction =
  | { type: typeof INIT_REPORT; payload: { name: string } }
  | { type: typeof SET_REPORT_DATE; payload: { report: string; date: ReportDate } }
  | { type: typeof SET_REPORT_PARAMETER; payload: { report: string; parameterName: string; parameterValue: unknown } }
  | { type: typeof GENERATE_REPORT; payload: { report: string } }
  | { type: typeof SET_REPORT_GENERATION_IN_PROGRESS; payload: { report: string; inProgress: boolean } };

export function initReport(name: string) {
  return {
    type: INIT_REPORT,
    payload: {
      name,
    },
  };
}

export function setReportDate(report: string, date: ReportDate) {
  return {
    type: SET_REPORT_DATE,
    payload: {
      report,
      date,
    },
  };
}

export function setReportParameter(report: string, parameterName: string, parameterValue: unknown) {
  return {
    type: SET_REPORT_PARAMETER,
    payload: {
      report,
      parameterName,
      parameterValue,
    },
  };
}

export function generateReport(report: string) {
  return {
    type: GENERATE_REPORT,
    payload: {
      report,
    },
  };
}

export function setReportGenerationInProgress(report: string, inProgress: boolean) {
  return {
    type: SET_REPORT_GENERATION_IN_PROGRESS,
    payload: {
      report,
      inProgress,
    },
  };
}
