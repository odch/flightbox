import { connect } from 'react-redux';
import { loadArrivals, monitorArrivals, deleteArrival } from '../modules/movements/arrivals';
import {
  showDeleteConfirmationDialog,
  hideDeleteConfirmationDialog,
  showArrivalWizard,
  createDepartureFromArrival,
  selectMovement
} from '../modules/ui/movements';

import MovementList from '../components/MovementList';

const mapStateToProps = state => {
  return {
    movementType: 'arrival',
    items: state.movements.arrivals.data.array,
    loading: state.movements.arrivals.loading,
    loadingFailed: state.movements.arrivals.loadingFailed,
    lockDate: state.settings.lockDate,
    deleteConfirmation: state.ui.movements.deleteConfirmation,
    selected: state.ui.movements.selected,
    actionIcon: 'flight_takeoff',
    actionLabel: 'Abflug erfassen'
  };
};

const mapActionCreators = {
  showDeleteConfirmationDialog,
  hideDeleteConfirmationDialog,
  loadItems: loadArrivals,
  monitorItems: monitorArrivals,
  deleteItem: deleteArrival,
  onEdit: showArrivalWizard,
  onAction: createDepartureFromArrival,
  onSelect: selectMovement,
};

export default connect(mapStateToProps, mapActionCreators)(MovementList);
