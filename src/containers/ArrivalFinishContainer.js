import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { loadAircraftSettings } from '../modules/settings/aircrafts';
import { createDepartureFromArrival } from '../modules/ui/movements';
import Finish, { FinishLoading } from '../components/wizards/ArrivalWizard/Finish';

class ArrivalFinishContainer extends Component {

  componentWillMount() {
    this.props.loadAircraftSettings();
  }

  render() {
    if (!this.props.aircraftSettings.club || !this.props.aircraftSettings.homeBase) {
      return (
        <FinishLoading/>
      );
    }

    const isHomeBase = this.props.aircraftSettings.club[this.props.immatriculation] === true
        || this.props.aircraftSettings.homeBase[this.props.immatriculation] === true;

    return (
      <Finish
        createDepartureFromArrival={this.props.createDepartureFromArrival}
        finish={this.props.finish}
        isUpdate={this.props.isUpdate}
        isHomeBase={isHomeBase}
        itemKey={this.props.itemKey}
      />
    );
  }
}

ArrivalFinishContainer.propTypes = {
  aircraftSettings: PropTypes.shape({
    club: PropTypes.object,
    homeBase: PropTypes.object,
  }).isRequired,
  createDepartureFromArrival: PropTypes.func.isRequired,
  loadAircraftSettings: PropTypes.func.isRequired,

  finish: PropTypes.func.isRequired,
  isUpdate: PropTypes.bool.isRequired,
  itemKey: PropTypes.string.isRequired,
  immatriculation: PropTypes.string.isRequired,
};

const mapStateToProps = (state, ownProps) => {
  return Object.assign({}, ownProps, {
    aircraftSettings: state.settings.aircrafts,
    finish: ownProps.finish,
    isUpdate: ownProps.isUpdate,
    itemKey: state.ui.wizard.itemKey,
    immatriculation: state.ui.wizard.values.immatriculation,
  });
};

const mapActionCreators = {
  createDepartureFromArrival,
  loadAircraftSettings,
};

export default connect(mapStateToProps, mapActionCreators)(ArrivalFinishContainer);
