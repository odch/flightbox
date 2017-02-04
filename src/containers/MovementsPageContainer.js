import { connect } from 'react-redux';
import { loadDepartures, deleteDeparture } from '../modules/movements/departures';
import { loadArrivals, deleteArrival } from '../modules/movements/arrivals';
import { loadLockDate } from '../modules/settings/lockDate';
import {
  showDeleteConfirmationDialog,
  hideDeleteConfirmationDialog,
  showDepartureWizard,
  showArrivalWizard,
  createDepartureFromArrival,
  createArrivalFromDeparture
} from '../modules/ui/movements';

import MovementsPage from '../components/MovementsPage';

const mapStateToProps = state => {
  return {
    movements: state.movements,
    lockDate: state.settings.lockDate,
    deleteConfirmation: state.ui.movements.deleteConfirmation,
  };
};

const mapActionCreators = {
  loadDepartures,
  deleteDeparture,
  loadArrivals,
  deleteArrival,
  loadLockDate,
  showDeleteConfirmationDialog,
  hideDeleteConfirmationDialog,
  showDepartureWizard,
  showArrivalWizard,
  createDepartureFromArrival,
  createArrivalFromDeparture
};

export default connect(mapStateToProps, mapActionCreators)(MovementsPage);
