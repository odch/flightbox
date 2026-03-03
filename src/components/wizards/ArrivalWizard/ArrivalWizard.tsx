import PropTypes from 'prop-types';
import React from 'react';
import MovementWizard from '../MovementWizard';
import { useTranslation } from 'react-i18next';
import AircraftPage from '../pages/AircraftPage';
import PilotPage from '../pages/PilotPage';
import PassengerPage from './pages/PassengerPage';
import DepartureArrivalPage from './pages/DepartureArrivalPage';
import FlightPage from '../../../containers/ArrivalFlightPageContainer';
import Finish from '../../../containers/ArrivalFinishContainer';
import LocationConfirmationDialog from '../../LocationConfirmationDialog';
import {exists as aerodromeExists} from '../../../util/aerodromes';

const ArrivalWizard = props => {
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
    },
  ];
  return (
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
      newMovementLabel={t('arrival.newLabel')}
      updateMovementLabel={t('arrival.editLabel')}
    />
  );
};

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
