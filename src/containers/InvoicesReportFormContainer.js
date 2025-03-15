import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {generateReport, initReport, setReportDate} from '../modules/reports';
import ReportForm from '../components/ReportForm';

class InvoicesReportFormContainer extends React.Component {

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

InvoicesReportFormContainer.propTypes = {
  initialized: PropTypes.bool.isRequired,
  date: PropTypes.shape({
    year: PropTypes.number,
    month: PropTypes.number,
  }),
  generationInProgress: PropTypes.bool,
  initReport: PropTypes.func.isRequired,
  setDate: PropTypes.func.isRequired,
  generate: PropTypes.func.isRequired,
};

const mapStateToProps = state => {
  let report = state.reports.invoices;
  let initialized = true;

  if (!report) {
    report = {
      parameters: {},
    };
    initialized = false;
  }

  return {
    initialized,
    date: report.date,
    generationInProgress: report.generationInProgress === true,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    initReport: () => dispatch(initReport('invoices')),
    setDate: date => dispatch(setReportDate('invoices', date)),
    generate: () => dispatch(generateReport('invoices')),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(InvoicesReportFormContainer);
