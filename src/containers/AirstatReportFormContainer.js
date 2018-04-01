import PropTypes from 'prop-types';
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
  initialized: PropTypes.bool.isRequired,
  date: PropTypes.shape({
    year: PropTypes.number,
    month: PropTypes.number,
  }),
  internal: PropTypes.bool,
  generationInProgress: PropTypes.bool,
  initReport: PropTypes.func.isRequired,
  setDate: PropTypes.func.isRequired,
  setInternal: PropTypes.func.isRequired,
  generate: PropTypes.func.isRequired,
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
