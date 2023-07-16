import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { loadAircraftSettings } from '../modules/settings/aircrafts';
import { createMovementFromMovement } from '../modules/ui/movements';
import Finish, { FinishLoading } from '../components/wizards/ArrivalWizard/Finish';

class ArrivalFinishContainer extends Component {

  componentWillMount() {
    this.props.loadAircraftSettings();
  }

  render() {
    const {
      aircraftSettings,
      immatriculation,
      landings,
      landingFeeSingle,
      landingFeeTotal,
      goArounds,
      goAroundFeeSingle,
      goAroundFeeTotal,
      createMovementFromMovement,
      finish,
      isUpdate,
      itemKey
    } = this.props

    if (!aircraftSettings.club || !aircraftSettings.homeBase) {
      return (
        <FinishLoading/>
      );
    }

    const isHomeBase = aircraftSettings.club[immatriculation] === true
        || aircraftSettings.homeBase[immatriculation] === true;

    return (
      <Finish
        createMovementFromMovement={createMovementFromMovement}
        finish={finish}
        isUpdate={isUpdate}
        isHomeBase={isHomeBase}
        itemKey={itemKey}
        landings={landings}
        landingFeeSingle={landingFeeSingle}
        landingFeeTotal={landingFeeTotal}
        goArounds={goArounds}
        goAroundFeeSingle={goAroundFeeSingle}
        goAroundFeeTotal={goAroundFeeTotal}
      />
    );
  }
}

ArrivalFinishContainer.propTypes = {
  aircraftSettings: PropTypes.shape({
    club: PropTypes.object,
    homeBase: PropTypes.object,
  }).isRequired,
  createMovementFromMovement: PropTypes.func.isRequired,
  loadAircraftSettings: PropTypes.func.isRequired,

  finish: PropTypes.func.isRequired,
  isUpdate: PropTypes.bool.isRequired,
  itemKey: PropTypes.string.isRequired,
  immatriculation: PropTypes.string.isRequired,
  landings: PropTypes.number.isRequired,
  landingFeeSingle: PropTypes.number,
  landingFeeTotal: PropTypes.number,
  goArounds: PropTypes.number,
  goAroundFeeSingle: PropTypes.number,
  goAroundFeeTotal: PropTypes.number
};

const mapStateToProps = (state, ownProps) => {
  return Object.assign({}, ownProps, {
    aircraftSettings: state.settings.aircrafts,
    finish: ownProps.finish,
    isUpdate: ownProps.isUpdate,
    itemKey: state.ui.wizard.itemKey,
    immatriculation: state.ui.wizard.values.immatriculation,
    landings: state.ui.wizard.values.landingCount,
    landingFeeSingle: state.ui.wizard.values.landingFeeSingle,
    landingFeeTotal: state.ui.wizard.values.landingFeeTotal,
    goArounds: state.ui.wizard.values.goAroundCount,
    goAroundFeeSingle: state.ui.wizard.values.goAroundFeeSingle,
    goAroundFeeTotal: state.ui.wizard.values.goAroundFeeTotal
  });
};

const mapActionCreators = {
  createMovementFromMovement,
  loadAircraftSettings,
};

export default connect(mapStateToProps, mapActionCreators)(ArrivalFinishContainer);
