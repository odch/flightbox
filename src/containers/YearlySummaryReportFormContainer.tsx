import React from 'react';
import {connect} from 'react-redux';
import {initReport, setReportDate, generateReport, setReportParameter} from '../modules/reports';
import YearlySummaryReportForm from '../components/YearlySummaryReportForm';
import {RootState} from '../modules';

interface ReportDate {
  year?: number;
}

class YearlySummaryReportFormContainer extends React.Component<{
  initialized: boolean;
  date?: ReportDate;
  delimiter?: string;
  generationInProgress?: boolean;
  initReport: () => void;
  setDate: (date: ReportDate) => void;
  setDelimiter: (delimiter: string) => void;
  generate: () => void;
}> {
  componentWillMount() {
    this.props.initReport();
  }

  render() {
    return (
      <YearlySummaryReportForm
        disabled={!this.props.initialized || this.props.generationInProgress}
        date={this.props.date}
        delimiter={this.props.delimiter}
        setDate={this.props.setDate}
        setDelimiter={this.props.setDelimiter}
        generate={this.props.generate}
      />
    );
  }
}

const mapStateToProps = (state: RootState) => {
  let report = (state.reports as any).yearlySummary;
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
  initReport: () => dispatch(initReport('yearlySummary')),
  setDate: (date: any) => dispatch(setReportDate('yearlySummary', date)),
  generate: () => dispatch(generateReport('yearlySummary')),
  setDelimiter: (delimiter: string) =>
    dispatch(setReportParameter('yearlySummary', 'delimiter', delimiter)),
});

export default connect(mapStateToProps, mapDispatchToProps)(YearlySummaryReportFormContainer);
