import PropTypes from 'prop-types';
import React from 'react';
import MovementWizard from '../MovementWizard';
import AircraftPage from '../pages/AircraftPage';
import PilotPage from '../pages/PilotPage';
import PassengerPage from './pages/PassengerPage';
import DepartureArrivalPage from './pages/DepartureArrivalPage';
import FlightPage from '../../../containers/ArrivalFlightPageContainer';
import Finish from '../../../containers/ArrivalFinishContainer';
import LocationConfirmationDialog from '../../LocationConfirmationDialog';
import {exists as aerodromeExists} from '../../../util/aerodromes';

const pages = [
  {
    component: AircraftPage,
    label: 'Flugzeugdaten',
  },
  {
    component: PilotPage,
    label: 'Pilot',
  },
  {
    component: PassengerPage,
    label: 'Passagiere',
  },
  {
    component: DepartureArrivalPage,
    label: 'Start und Ziel',
    dialog: {
      predicate: data => data.location ? aerodromeExists(data.location) : Promise.resolve(false),
      name: 'LOCATION_CONFIRMATION',
      component: LocationConfirmationDialog,
    }
  },
  {
    component: FlightPage,
    label: 'Flug',
  },
];

const ArrivalWizard = props => (
  <MovementWizard
    {...props}
    initNewMovement={props.initNewMovement.bind(null, 'arrival')}
    initMovement={props.match.params.departureKey
      ? props.initNewMovementFromMovement.bind(null, 'arrival', 'departure', props.match.params.departureKey)
      : null}
    editMovement={props.editMovement.bind(null, 'arrival')}
    pages={pages}
    className="ArrivalWizard"
    finishComponentClass={Finish}
    newMovementLabel="Neue Ankunft"
    updateMovementLabel="Ankunft bearbeiten"
  />
);

ArrivalWizard.propTypes = {
  wizard: PropTypes.object.isRequired,
  match: PropTypes.shape({
    params: PropTypes.object.isRequired
  }).isRequired,
  initNewMovement: PropTypes.func.isRequired,
  initNewMovementFromMovement: PropTypes.func.isRequired,
  editMovement: PropTypes.func.isRequired,
  nextPage: PropTypes.func.isRequired,
  previousPage: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired,
  finish: PropTypes.func.isRequired,
  saveMovement: PropTypes.func.isRequired,
  unsetCommitError: PropTypes.func.isRequired,
  showDialog: PropTypes.func.isRequired,
  hideDialog: PropTypes.func.isRequired,
};

export default ArrivalWizard;
