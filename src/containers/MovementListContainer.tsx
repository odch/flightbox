import {connect} from 'react-redux';
import {deleteMovement, loadMovements} from '../modules/movements';
import {
  createMovementFromMovement,
  hideDeleteConfirmationDialog,
  selectMovement,
  showDeleteConfirmationDialog,
  showMovementWizard,
} from '../modules/ui/movements';
import {loadAircraftSettings} from '../modules/settings/aircrafts';
import {checkCustomsAvailability} from '../modules/customs';
import {loadAerodromes} from '../modules/aerodromes';
import MovementList from '../components/MovementList';
import ImmutableItemsArray from '../util/ImmutableItemsArray';
import {RootState} from '../modules';

const getMovementsFromState = (state: RootState) =>
  new ImmutableItemsArray(
    (state.movements.data as any).array.map((movement: any) => ({
      ...movement,
      associatedMovement:
        (state.movements as any).associatedMovements[
          movement.type === 'departure' ? 'departures' : 'arrivals'
        ][movement.key],
    })),
  );

const getMovements = (state: RootState) => {
  const data = getMovementsFromState(state);
  const filter = state.movements.filter;

  const dateFilterSet = !!(filter as any).date.start && !!(filter as any).date.end;

  if (!dateFilterSet) {
    return data;
  }

  const immatriculationFilter = (state.movements.filter as any).immatriculation;
  const onlyWithoutAssociatedMovement = (state.movements.filter as any).onlyWithoutAssociatedMovement;

  if (
    (immatriculationFilter && immatriculationFilter.length >= 3) ||
    onlyWithoutAssociatedMovement
  ) {
    const filteredData = (data as any).array.filter((item: any) => {
      if (
        immatriculationFilter &&
        immatriculationFilter.length >= 3 &&
        !item.immatriculation.includes(immatriculationFilter)
      ) {
        return false;
      }
      if (onlyWithoutAssociatedMovement) {
        if (
          !item.associatedMovement ||
          ['departure', 'arrival'].includes(item.associatedMovement.type)
        ) {
          return false;
        }
      }
      return true;
    });
    return new ImmutableItemsArray(filteredData);
  }

  return data;
};

const mapStateToProps = (state: RootState) => ({
  items: getMovements(state),
  loading: state.movements.loading,
  loadingFailed: (state.movements as any).loadingFailed,
  lockDate: state.settings.lockDate,
  aircraftSettings: state.settings.aircrafts,
  deleteConfirmation: (state.ui.movements as any).deleteConfirmation,
  selected: (state.ui.movements as any).selected,
  autoLoadDisabled:
    (state.movements.filter as any).date.start &&
    (state.movements.filter as any).date.end,
  isAdmin: (state.auth as any).data.admin,
});

const mapActionCreators = {
  showDeleteConfirmationDialog,
  hideDeleteConfirmationDialog,
  createMovementFromMovement,
  loadAircraftSettings,
  checkCustomsAvailability,
  loadAerodromes,
  loadItems: loadMovements,
  deleteItem: deleteMovement,
  onEdit: showMovementWizard,
  onSelect: selectMovement,
};

export default connect(mapStateToProps, mapActionCreators)(MovementList);
