import { connect } from 'react-redux';
import { loadArrivals, deleteArrival } from '../modules/movements/arrivals';
import {
  showDeleteConfirmationDialog,
  hideDeleteConfirmationDialog,
  showArrivalWizard,
  createDepartureFromArrival,
} from '../modules/ui/movements';

import MovementList from '../components/MovementList';

const mapStateToProps = state => {
  return {
    items: state.movements.arrivals.data.array,
    loading: state.movements.arrivals.loading,
    loadingFailed: state.movements.arrivals.loadingFailed,
    lockDate: state.settings.lockDate,
    deleteConfirmation: state.ui.movements.deleteConfirmation,
    actionIcon: 'flight_takeoff',
    actionLabel: 'Abflug erfassen'
  };
};

const mapActionCreators = {
  showDeleteConfirmationDialog,
  hideDeleteConfirmationDialog,
  loadItems: loadArrivals,
  deleteItem: deleteArrival,
  onClick: showArrivalWizard,
  onAction: createDepartureFromArrival
};

export default connect(mapStateToProps, mapActionCreators)(MovementList);
