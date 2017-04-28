import { connect } from 'react-redux';
import { loadDepartures, monitorDepartures, deleteDeparture } from '../modules/movements/departures';
import {
  showDeleteConfirmationDialog,
  hideDeleteConfirmationDialog,
  showDepartureWizard,
  createArrivalFromDeparture,
  selectMovement
} from '../modules/ui/movements';

import MovementList from '../components/MovementList';

const mapStateToProps = state => {
  return {
    items: state.movements.departures.data.array,
    loading: state.movements.departures.loading,
    loadingFailed: state.movements.departures.loadingFailed,
    lockDate: state.settings.lockDate,
    deleteConfirmation: state.ui.movements.deleteConfirmation,
    selected: state.ui.movements.selected,
    actionIcon: 'flight_land',
    actionLabel: 'Ankunft erfassen'
  };
};

const mapActionCreators = {
  showDeleteConfirmationDialog,
  hideDeleteConfirmationDialog,
  loadItems: loadDepartures,
  monitorItems: monitorDepartures,
  deleteItem: deleteDeparture,
  onEdit: showDepartureWizard,
  onAction: createArrivalFromDeparture,
  onSelect: selectMovement,
};

export default connect(mapStateToProps, mapActionCreators)(MovementList);
