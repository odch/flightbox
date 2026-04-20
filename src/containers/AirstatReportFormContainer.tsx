import React, { useEffect } from 'react';
import {connect} from 'react-redux';
import {initReport, setReportDate, setReportParameter, generateReport} from '../modules/reports';
import AirstatReportForm from '../components/AirstatReportForm';
import {RootState} from '../modules';

interface ReportDate {
  year?: number;
  month?: number;
}

interface Props {
  initialized: boolean;
  date?: ReportDate;
  internal?: boolean;
  delimiter?: string;
  generationInProgress?: boolean;
  initReport: () => void;
  setDate: (date: ReportDate) => void;
  setInternal: (internal: boolean) => void;
  setDelimiter: (delimiter: string) => void;
  generate: () => void;
}

const AirstatReportFormContainer = (props: Props) => {
  useEffect(() => {
    props.initReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AirstatReportForm
      disabled={!props.initialized || props.generationInProgress}
      date={props.date}
      internal={props.internal}
      delimiter={props.delimiter}
      setDate={props.setDate}
      setInternal={props.setInternal}
      setDelimiter={props.setDelimiter}
      generate={props.generate}
    />
  );
};

const mapStateToProps = (state: RootState) => {
  let report = (state.reports as any).airstat;
  let initialized = true;

  if (!report) {
    report = {parameters: {}};
    initialized = false;
  }

  return {
    initialized,
    date: report.date,
    internal: report.parameters.internal === true,
    delimiter: report.parameters.delimiter,
    generationInProgress: report.generationInProgress === true,
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  initReport: () => dispatch(initReport('airstat')),
  setDate: (date: any) => dispatch(setReportDate('airstat', date)),
  setInternal: (internal: boolean) =>
    dispatch(setReportParameter('airstat', 'internal', internal)),
  setDelimiter: (delimiter: string) =>
    dispatch(setReportParameter('airstat', 'delimiter', delimiter)),
  generate: () => dispatch(generateReport('airstat')),
});

export default connect(mapStateToProps, mapDispatchToProps)(AirstatReportFormContainer);
