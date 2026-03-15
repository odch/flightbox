import React from 'react';
import {connect} from 'react-redux';
import {initReport, setReportDate, setReportParameter, generateReport} from '../modules/reports';
import AirstatReportForm from '../components/AirstatReportForm';
import {RootState} from '../modules';

interface ReportDate {
  year?: number;
  month?: number;
}

class AirstatReportFormContainer extends React.Component<{
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
}> {
  componentWillMount() {
    this.props.initReport();
  }

  render() {
    return (
      <AirstatReportForm
        disabled={!this.props.initialized || this.props.generationInProgress}
        date={this.props.date}
        internal={this.props.internal}
        delimiter={this.props.delimiter}
        setDate={this.props.setDate}
        setInternal={this.props.setInternal}
        setDelimiter={this.props.setDelimiter}
        generate={this.props.generate}
      />
    );
  }
}

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
