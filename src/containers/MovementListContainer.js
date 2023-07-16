import { connect } from 'react-redux';
import { loadMovements, deleteMovement } from '../modules/movements';
import {
  showDeleteConfirmationDialog,
  hideDeleteConfirmationDialog,
  showMovementWizard,
  createMovementFromMovement,
  selectMovement
} from '../modules/ui/movements';
import { loadAircraftSettings } from '../modules/settings/aircrafts'

import MovementList from '../components/MovementList';
import ImmutableItemsArray from '../util/ImmutableItemsArray';

const getMovements = state => {
  const data = state.movements.data;
  const associatedMovements = state.movements.associatedMovements;
  const filter = state.movements.filter;

  const dateFilterSet = !!filter.date.start && !!filter.date.end

  if (!dateFilterSet) {
    return data;
  }

  const immatriculationFilter = state.movements.filter.immatriculation;
  const onlyWithoutAssociatedMovement = state.movements.filter.onlyWithoutAssociatedMovement;

  if (immatriculationFilter && immatriculationFilter.length >= 3 || onlyWithoutAssociatedMovement) {
    const filteredData = data.array.filter(item => {
      if (immatriculationFilter && immatriculationFilter.length >= 3 && !item.immatriculation.includes(immatriculationFilter)) {
        return false;
      }
      if (onlyWithoutAssociatedMovement) {
        if (associatedMovements[item.key]) {
          return false;
        }
      }
      return true;
    });
    return new ImmutableItemsArray(filteredData);
  }

  return data;
};

const mapStateToProps = state => {
  return {
    items: getMovements(state),
    associatedMovements: state.movements.associatedMovements,
    loading: state.movements.loading,
    loadingFailed: state.movements.loadingFailed,
    lockDate: state.settings.lockDate,
    aircraftSettings: state.settings.aircrafts,
    deleteConfirmation: state.ui.movements.deleteConfirmation,
    selected: state.ui.movements.selected,
    autoLoadDisabled: state.movements.filter.date.start && state.movements.filter.date.end,
    isAdmin: state.auth.data.admin
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
