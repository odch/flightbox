import React from 'react';
import { connect } from 'react-redux';
import { initReport, setReportDate, setReportParameter, generateReport } from '../modules/reports';
import AirstatReportForm from '../components/AirstatReportForm';

class AirstatReportFormContainer extends React.Component {

  componentWillMount() {
    this.props.initReport();
  }

  render() {
    return (
      <AirstatReportForm
        disabled={!this.props.initialized || this.props.generationInProgress}
        date={this.props.date}
        internal={this.props.internal}
        setDate={this.props.setDate}
        setInternal={this.props.setInternal}
        generate={this.props.generate}
      />
    );
  }
}

AirstatReportFormContainer.propTypes = {
  initialized: React.PropTypes.bool.isRequired,
  date: React.PropTypes.shape({
    year: React.PropTypes.number,
    month: React.PropTypes.number,
  }),
  internal: React.PropTypes.bool,
  generationInProgress: React.PropTypes.bool,
  initReport: React.PropTypes.func.isRequired,
  setDate: React.PropTypes.func.isRequired,
  setInternal: React.PropTypes.func.isRequired,
  generate: React.PropTypes.func.isRequired,
};

const mapStateToProps = state => {
  let report = state.reports.airstat;
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
    internal: report.parameters.internal === true,
    generationInProgress: report.generationInProgress === true,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    initReport: () => dispatch(initReport('airstat')),
    setDate: date => dispatch(setReportDate('airstat', date)),
    setInternal: internal => dispatch(setReportParameter('airstat', 'internal', internal)),
    generate: () => dispatch(generateReport('airstat')),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(AirstatReportFormContainer);
