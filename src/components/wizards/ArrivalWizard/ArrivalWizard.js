import React from 'react';
import MovementWizard from '../MovementWizard';
import AircraftPage from '../pages/AircraftPage';
import PilotPage from '../pages/PilotPage';
import PassengerPage from './pages/PassengerPage';
import DepartureArrivalPage from './pages/DepartureArrivalPage';
import FlightPage from '../../../containers/ArrivalFlightPageContainer';
import Finish from '../../../containers/ArrivalFinishContainer';
import LocationConfirmationDialog from '../../LocationConfirmationDialog';
import { exists as aerodromeExists } from '../../../util/aerodromes';

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
    initMovement={props.params.departureKey
      ? props.initNewMovementFromMovement.bind(null, 'arrival', 'departure', props.params.departureKey)
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
  wizard: React.PropTypes.object.isRequired,
  params: React.PropTypes.object.isRequired,
  initNewMovement: React.PropTypes.func.isRequired,
  initNewMovementFromMovement: React.PropTypes.func.isRequired,
  editMovement: React.PropTypes.func.isRequired,
  nextPage: React.PropTypes.func.isRequired,
  previousPage: React.PropTypes.func.isRequired,
  cancel: React.PropTypes.func.isRequired,
  finish: React.PropTypes.func.isRequired,
  saveMovement: React.PropTypes.func.isRequired,
  unsetCommitError: React.PropTypes.func.isRequired,
  destroyForm: React.PropTypes.func.isRequired,
  showDialog: React.PropTypes.func.isRequired,
  hideDialog: React.PropTypes.func.isRequired,
};

ArrivalWizard.contextTypes = {
  router: React.PropTypes.object.isRequired,
};

export default ArrivalWizard;
