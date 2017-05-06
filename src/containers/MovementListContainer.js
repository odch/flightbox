import { connect } from 'react-redux';
import { loadMovements, monitorMovements, deleteMovement } from '../modules/movements';
import {
  showDeleteConfirmationDialog,
  hideDeleteConfirmationDialog,
  showMovementWizard,
  createMovementFromMovement,
  selectMovement
} from '../modules/ui/movements';

import MovementList from '../components/MovementList';

const mapStateToProps = state => {
  return {
    items: state.movements.data.array,
    loading: state.movements.loading,
    loadingFailed: state.movements.loadingFailed,
    lockDate: state.settings.lockDate,
    deleteConfirmation: state.ui.movements.deleteConfirmation,
    selected: state.ui.movements.selected
  };
};

const mapActionCreators = {
  showDeleteConfirmationDialog,
  hideDeleteConfirmationDialog,
  createMovementFromMovement,
  loadItems: loadMovements,
  monitorItems: monitorMovements,
  deleteItem: deleteMovement,
  onEdit: showMovementWizard,
  onSelect: selectMovement,
};

export default connect(mapStateToProps, mapActionCreators)(MovementList);
