import PropTypes from 'prop-types';
import React from 'react';
import MovementWizard from '../MovementWizard';
import { useTranslation } from 'react-i18next';
import AircraftPage from '../pages/AircraftPage';
import PilotPage from '../pages/PilotPage';
import PassengerPage from './pages/PassengerPage';
import DepartureArrivalPage from './pages/DepartureArrivalPage';
import FlightPage from '../../../containers/DepartureFlightPageContainer';
import CommitRequirementsDialog from './CommitRequirementsDialog';
import LocationConfirmationDialog from '../../LocationConfirmationDialog';
import Finish from './Finish';
import {exists as aerodromeExists} from '../../../util/aerodromes';

const DepartureWizard = props => {
  const { t } = useTranslation();
  const pages = [
    {
      component: AircraftPage,
      label: t('movement.details.aircraftData'),
    },
    {
      component: PilotPage,
      label: t('movement.details.pilot'),
    },
    {
      component: PassengerPage,
      label: t('movement.details.passengers'),
    },
    {
      component: DepartureArrivalPage,
      label: t('movement.details.flightInfo'),
      dialog: {
        predicate: data => data.location ? aerodromeExists(data.location) : Promise.resolve(false),
        name: 'LOCATION_CONFIRMATION',
        component: LocationConfirmationDialog,
      }
    },
    {
      component: FlightPage,
      label: t('movement.details.flight'),
      dialog: {
        predicate: data => data.key ? Promise.resolve(false) : Promise.resolve(true),
        name: 'COMMIT_REQUIREMENTS',
        component: CommitRequirementsDialog,
      }
    },
  ];
  return (
    <MovementWizard
      {...props}
      initNewMovement={props.initNewMovement.bind(null, 'departure')}
      initMovement={props.match.params.arrivalKey
        ? props.initNewMovementFromMovement.bind(null, 'departure', 'arrival', props.match.params.arrivalKey)
        : null}
      editMovement={props.editMovement.bind(null, 'departure')}
      pages={pages}
      className="DepartureWizard"
      finishComponentClass={Finish}
      newMovementLabel={t('departure.newLabel')}
      updateMovementLabel={t('departure.editLabel')}
    />
  );
};

DepartureWizard.propTypes = {
  wizard: PropTypes.object.isRequired,
  match: PropTypes.shape({
    params: PropTypes.object.isRequired
  }).isRequired,
  initNewMovement: PropTypes.func.isRequired,
  initNewMovementFromMovement: PropTypes.func.isRequired,
  editMovement: PropTypes.func.isRequired,
  updateValues: PropTypes.func.isRequired,
  nextPage: PropTypes.func.isRequired,
  previousPage: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired,
  finish: PropTypes.func.isRequired,
  showDialog: PropTypes.func.isRequired,
  hideDialog: PropTypes.func.isRequired,
  saveMovement: PropTypes.func.isRequired,
  unsetCommitError: PropTypes.func.isRequired,
};

export default DepartureWizard;
