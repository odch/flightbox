import React from 'react';
import MovementWizard from '../MovementWizard';
import AircraftPage from '../pages/AircraftPage';
import PilotPage from '../pages/PilotPage';
import PassengerPage from './pages/PassengerPage';
import DepartureArrivalPage from './pages/DepartureArrivalPage';
import FlightPage from './pages/FlightPage';
import CommitRequirementsDialog from './CommitRequirementsDialog';
import Finish from './Finish';
import './DepartureWizard.scss';

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
  },
  {
    component: FlightPage,
    label: 'Flug',
  },
];

const DepartureWizard = props => (
  <MovementWizard
    {...props}
    initMovement={props.params.arrivalKey ? props.initNewDepartureFromArrival.bind(null, props.params.arrivalKey) : null}
    pages={pages}
    className="DepartureWizard"
    finishComponentClass={Finish}
    commitRequirementsDialogClass={CommitRequirementsDialog}
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
  finish: React.PropTypes.func.isRequired,
  showCommitRequirementsDialog: React.PropTypes.func.isRequired,
  hideCommitRequirementsDialog: React.PropTypes.func.isRequired,
  saveMovement: React.PropTypes.func.isRequired,
  unsetCommitError: React.PropTypes.func.isRequired,
  destroyForm: React.PropTypes.func.isRequired,
};

DepartureWizard.contextTypes = {
  router: React.PropTypes.object.isRequired,
};

export default DepartureWizard;
