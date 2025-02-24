import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {loadAircraftSettings} from '../modules/settings/aircrafts';
import {createMovementFromMovement} from '../modules/ui/movements';
import Finish, {FinishLoading} from '../components/wizards/ArrivalWizard/Finish';

class ArrivalFinishContainer extends Component {

  componentWillMount() {
    this.props.loadAircraftSettings();
  }

  render() {
    const {
      aircraftSettings,
      email,
      immatriculation,
      landings,
      landingFeeSingle,
      landingFeeCode,
      landingFeeTotal,
      goArounds,
      goAroundFeeSingle,
      goAroundFeeCode,
      goAroundFeeTotal,
      createMovementFromMovement,
      finish,
      isUpdate,
      itemKey,
      localUser
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
        email={email}
        immatriculation={immatriculation}
        isHomeBase={isHomeBase}
        itemKey={itemKey}
        landings={landings}
        landingFeeSingle={landingFeeSingle}
        landingFeeCode={landingFeeCode}
        landingFeeTotal={landingFeeTotal}
        goArounds={goArounds}
        goAroundFeeSingle={goAroundFeeSingle}
        goAroundFeeCode={goAroundFeeCode}
        goAroundFeeTotal={goAroundFeeTotal}
        localUser={localUser}
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
  email: PropTypes.string.isRequired,
  immatriculation: PropTypes.string.isRequired,
  landings: PropTypes.number.isRequired,
  landingFeeSingle: PropTypes.number,
  landingFeeCode: PropTypes.string,
  landingFeeTotal: PropTypes.number,
  goArounds: PropTypes.number,
  goAroundFeeSingle: PropTypes.number,
  goAroundFeeCoe: PropTypes.string,
  goAroundFeeTotal: PropTypes.number
};

const mapStateToProps = (state, ownProps) => {
  return Object.assign({}, ownProps, {
    aircraftSettings: state.settings.aircrafts,
    finish: ownProps.finish,
    isUpdate: ownProps.isUpdate,
    itemKey: state.ui.wizard.itemKey,
    email: state.ui.wizard.values.email,
    immatriculation: state.ui.wizard.values.immatriculation,
    landings: state.ui.wizard.values.landingCount,
    landingFeeSingle: state.ui.wizard.values.landingFeeSingle,
    landingFeeCode: state.ui.wizard.values.landingFeeCode,
    landingFeeTotal: state.ui.wizard.values.landingFeeTotal,
    goArounds: state.ui.wizard.values.goAroundCount,
    goAroundFeeSingle: state.ui.wizard.values.goAroundFeeSingle,
    goAroundFeeCode: state.ui.wizard.values.goAroundFeeCode,
    goAroundFeeTotal: state.ui.wizard.values.goAroundFeeTotal,
    localUser: state.auth.data.local
  });
};

const mapActionCreators = {
  createMovementFromMovement,
  loadAircraftSettings,
};

export default connect(mapStateToProps, mapActionCreators)(ArrivalFinishContainer);
