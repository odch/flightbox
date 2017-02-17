import { connect } from 'react-redux';
import { loadDepartures, deleteDeparture } from '../modules/movements/departures';
import {
  showDeleteConfirmationDialog,
  hideDeleteConfirmationDialog,
  showDepartureWizard,
  createArrivalFromDeparture
} from '../modules/ui/movements';

import MovementList from '../components/MovementList';

const mapStateToProps = state => {
  return {
    items: state.movements.departures.data.array,
    loading: state.movements.departures.loading,
    loadingFailed: state.movements.departures.loadingFailed,
    lockDate: state.settings.lockDate,
    deleteConfirmation: state.ui.movements.deleteConfirmation,
    actionIcon: 'flight_land',
    actionLabel: 'Ankunft erfassen'
  };
};

const mapActionCreators = {
  showDeleteConfirmationDialog,
  hideDeleteConfirmationDialog,
  loadItems: loadDepartures,
  deleteItem: deleteDeparture,
  onClick: showDepartureWizard,
  onAction: createArrivalFromDeparture
};

export default connect(mapStateToProps, mapActionCreators)(MovementList);
