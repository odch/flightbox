import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { initReport, setReportDate, generateReport } from '../modules/reports';
import YearlySummaryReportForm from '../components/YearlySummaryReportForm';

class YearlySummaryReportFormContainer extends React.Component {

  componentWillMount() {
    this.props.initReport();
  }

  render() {
    return (
      <YearlySummaryReportForm
        disabled={!this.props.initialized || this.props.generationInProgress}
        date={this.props.date}
        setDate={this.props.setDate}
        generate={this.props.generate}
      />
    );
  }
}

YearlySummaryReportFormContainer.propTypes = {
  initialized: PropTypes.bool.isRequired,
  date: PropTypes.shape({
    year: PropTypes.number,
  }),
  generationInProgress: PropTypes.bool,
  initReport: PropTypes.func.isRequired,
  setDate: PropTypes.func.isRequired,
  generate: PropTypes.func.isRequired,
};

const mapStateToProps = state => {
  let report = state.reports.yearlySummary;
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
    initReport: () => dispatch(initReport('yearlySummary')),
    setDate: date => dispatch(setReportDate('yearlySummary', date)),
    generate: () => dispatch(generateReport('yearlySummary')),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(YearlySummaryReportFormContainer);
