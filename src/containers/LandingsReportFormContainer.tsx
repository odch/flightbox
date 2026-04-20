import React, { useEffect } from 'react';
import {connect} from 'react-redux';
import {initReport, setReportDate, generateReport, setReportParameter} from '../modules/reports';
import ReportForm from '../components/ReportForm';
import {RootState} from '../modules';

interface ReportDate {
  year?: number;
  month?: number;
}

interface Props {
  initialized: boolean;
  date?: ReportDate;
  delimiter?: string;
  generationInProgress?: boolean;
  initReport: () => void;
  setDate: (date: ReportDate) => void;
  setDelimiter: (delimiter: string) => void;
  generate: () => void;
}

const LandingsReportFormContainer = (props: Props) => {
  useEffect(() => {
    props.initReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ReportForm
      disabled={!props.initialized || props.generationInProgress}
      date={props.date}
      delimiter={props.delimiter}
      setDate={props.setDate}
      setDelimiter={props.setDelimiter}
      generate={props.generate}
    />
  );
};

const mapStateToProps = (state: RootState) => {
  let report = (state.reports as any).landings;
  let initialized = true;

  if (!report) {
    report = {parameters: {}};
    initialized = false;
  }

  return {
    initialized,
    date: report.date,
    delimiter: report.parameters.delimiter,
    generationInProgress: report.generationInProgress === true,
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  initReport: () => dispatch(initReport('landings')),
  setDate: (date: any) => dispatch(setReportDate('landings', date)),
  generate: () => dispatch(generateReport('landings')),
  setDelimiter: (delimiter: string) =>
    dispatch(setReportParameter('landings', 'delimiter', delimiter)),
});

export default connect(mapStateToProps, mapDispatchToProps)(LandingsReportFormContainer);
