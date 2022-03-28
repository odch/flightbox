import { connect } from 'react-redux';
import { loadMovements, monitorMovements, deleteMovement } from '../modules/movements';
import {
  showDeleteConfirmationDialog,
  hideDeleteConfirmationDialog,
  showMovementWizard,
  createMovementFromMovement,
  selectMovement
} from '../modules/ui/movements';
import { loadAircraftSettings } from '../modules/settings/aircrafts'

import MovementList from '../components/MovementList';

const mapStateToProps = state => {
  return {
    items: state.movements.data,
    associatedMovements: state.movements.associatedMovements,
    loading: state.movements.loading,
    loadingFailed: state.movements.loadingFailed,
    lockDate: state.settings.lockDate,
    aircraftSettings: state.settings.aircrafts,
    deleteConfirmation: state.ui.movements.deleteConfirmation,
    selected: state.ui.movements.selected
  };
};

const mapActionCreators = {
  showDeleteConfirmationDialog,
  hideDeleteConfirmationDialog,
  createMovementFromMovement,
  loadAircraftSettings,
  loadItems: loadMovements,
  deleteItem: deleteMovement,
  onEdit: showMovementWizard,
  onSelect: selectMovement,
};

export default connect(mapStateToProps, mapActionCreators)(MovementList);
