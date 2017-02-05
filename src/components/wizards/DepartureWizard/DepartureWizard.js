import React from 'react';
import MovementWizard from '../MovementWizard';
import AircraftPage from '../pages/AircraftPage';
import PilotPage from '../pages/PilotPage';
import PassengerPage from './pages/PassengerPage';
import DepartureArrivalPage from './pages/DepartureArrivalPage';
import FlightPage from '../../../containers/DepartureFlightPageContainer';
import CommitRequirementsDialog from './CommitRequirementsDialog';
import LocationConfirmationDialog from '../../LocationConfirmationDialog';
import Finish from './Finish';
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
    dialog: {
      predicate: data => data.key ? Promise.resolve(false) : Promise.resolve(true),
      name: 'COMMIT_REQUIREMENTS',
      component: CommitRequirementsDialog,
    }
  },
];

const DepartureWizard = props => (
  <MovementWizard
    {...props}
    initMovement={props.params.arrivalKey ? props.initNewDepartureFromArrival.bind(null, props.params.arrivalKey) : null}
    pages={pages}
    className="DepartureWizard"
    finishComponentClass={Finish}
    newMovementLabel="Neuer Abflug"
    updateMovementLabel="Abflug bearbeiten"
  />
);

DepartureWizard.propTypes = {
  wizard: React.PropTypes.object.isRequired,
  params: React.PropTypes.object.isRequired,
  initNewMovement: React.PropTypes.func.isRequired,
  initNewDepartureFromArrival: React.PropTypes.func.isRequired,
  editMovement: React.PropTypes.func.isRequired,
  nextPage: React.PropTypes.func.isRequired,
  previousPage: React.PropTypes.func.isRequired,
  cancel: React.PropTypes.func.isRequired,
  finish: React.PropTypes.func.isRequired,
  showDialog: React.PropTypes.func.isRequired,
  hideDialog: React.PropTypes.func.isRequired,
  saveMovement: React.PropTypes.func.isRequired,
  unsetCommitError: React.PropTypes.func.isRequired,
  destroyForm: React.PropTypes.func.isRequired,
};

DepartureWizard.contextTypes = {
  router: React.PropTypes.object.isRequired,
};

export default DepartureWizard;
