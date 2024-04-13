import {connect} from 'react-redux';
import {deleteMovement, loadMovements} from '../modules/movements';
import {
  createMovementFromMovement,
  hideDeleteConfirmationDialog,
  selectMovement,
  showDeleteConfirmationDialog,
  showMovementWizard
} from '../modules/ui/movements';
import {loadAircraftSettings} from '../modules/settings/aircrafts'

import MovementList from '../components/MovementList';
import ImmutableItemsArray from '../util/ImmutableItemsArray';

/**
 * Sometimes there's a bug which results in empty departures/arrivals with just
 * `associatedMovement: {type: 'none' }`.
 *
 * Couldn't find out what the reason for this yet. But by filtering them out here
 * we make sure that the movement list can still be used (otherwise there are null
 * pointers, because all the required fields are missing on the movement).
 */
const getMovementsFromState = state => new ImmutableItemsArray(
  state.movements.data.array
    .filter(movement => !!movement.location)
)

const getMovements = state => {
  const data = getMovementsFromState(state)
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
        if (!item.associatedMovement || ['departure', 'arrival'].includes(item.associatedMovement.type)) {
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
