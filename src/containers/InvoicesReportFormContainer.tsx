import React from 'react';
import {connect} from 'react-redux';
import {generateReport, initReport, setReportDate} from '../modules/reports';
import ReportForm from '../components/ReportForm';
import {RootState} from '../modules';

interface ReportDate {
  year?: number;
  month?: number;
}

class InvoicesReportFormContainer extends React.Component<{
  initialized: boolean;
  date?: ReportDate;
  generationInProgress?: boolean;
  initReport: () => void;
  setDate: (date: ReportDate) => void;
  generate: () => void;
}> {
  componentWillMount() {
    this.props.initReport();
  }

  render() {
    return (
      <ReportForm
        disabled={!this.props.initialized || this.props.generationInProgress}
        date={this.props.date}
        setDate={this.props.setDate}
        generate={this.props.generate}
        withDelimiter={false}
      />
    );
  }
}

const mapStateToProps = (state: RootState) => {
  let report = (state.reports as any).invoices;
  let initialized = true;

  if (!report) {
    report = {parameters: {}};
    initialized = false;
  }

  return {
    initialized,
    date: report.date,
    generationInProgress: report.generationInProgress === true,
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  initReport: () => dispatch(initReport('invoices')),
  setDate: (date: any) => dispatch(setReportDate('invoices', date)),
  generate: () => dispatch(generateReport('invoices')),
});

export default connect(mapStateToProps, mapDispatchToProps)(InvoicesReportFormContainer);
