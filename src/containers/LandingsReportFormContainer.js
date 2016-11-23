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
  initialized: React.PropTypes.bool.isRequired,
  date: React.PropTypes.string,
  generationInProgress: React.PropTypes.bool,
  initReport: React.PropTypes.func.isRequired,
  setDate: React.PropTypes.func.isRequired,
  generate: React.PropTypes.func.isRequired,
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
