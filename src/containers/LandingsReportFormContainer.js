import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { initReport, setReportDate, generateReport } from '../modules/reports';
import ReportForm from '../components/ReportForm';

class LandingsReportFormContainer extends React.Component {

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
      />
    );
  }
}

LandingsReportFormContainer.propTypes = {
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
  let report = state.reports.landings;
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
    initReport: () => dispatch(initReport('landings')),
    setDate: date => dispatch(setReportDate('landings', date)),
    generate: () => dispatch(generateReport('landings')),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(LandingsReportFormContainer);
