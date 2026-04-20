import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Predicates from './Predicates';
import MovementGroup from './MovementGroup';
import LoadingInfo from './LoadingInfo';
import LoadingFailureInfo from './LoadingFailureInfo';
import NoMovementsInfo from './NoMovmementsInfo';
import MovementDeleteConfirmationDialog from '../MovementDeleteConfirmationDialog';
import {AutoLoad} from '../../util/AutoLoad';
import MovementFilter from '../../containers/MovementFilterContainer';

const afterTodayPredicate = Predicates.newerThanSameDay();
const todayPredicate = Predicates.sameDay();
const yesterdayPredicate = Predicates.dayBefore();
const thisMonthPredicate = Predicates.and(
  Predicates.sameMonth(),
  Predicates.olderThanSameDay(),
  Predicates.not(Predicates.dayBefore())
);
const olderPredicate = Predicates.and(
  Predicates.olderThanSameMonth(),
  Predicates.not(Predicates.dayBefore())
);

/**
 * future
 * today
 * yesterday
 * this month
 * older
 */
const MovementList = (props: any) => {
  const { t } = useTranslation();

  useEffect(() => {
    props.loadAircraftSettings();
    props.loadAerodromes();
    props.checkCustomsAvailability();
    props.onSelect(null);
    props.loadItems(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (props.lockDate.loading === true
    || !props.aircraftSettings.club
    || !props.aircraftSettings.homeBase) {
    return <LoadingInfo/>;
  }

  const confirmationDialog = props.deleteConfirmation ? (
    <MovementDeleteConfirmationDialog
      item={props.deleteConfirmation}
      confirm={props.deleteItem}
      hide={props.hideDeleteConfirmationDialog}
    />
  ) : null;

  return (
    <div>
      {props.isAdmin === true && <MovementFilter/>}
      <MovementGroup
        label={t('movement.groups.tomorrow')}
        items={props.items}
        selected={props.selected}
        onSelect={props.onSelect}
        predicate={afterTodayPredicate}
        onEdit={props.onEdit}
        timeWithDate={true}
        createMovementFromMovement={props.createMovementFromMovement}
        onDelete={props.showDeleteConfirmationDialog}
        lockDate={props.lockDate.date}
        aircraftSettings={props.aircraftSettings}
        loading={props.loading}
        isAdmin={props.isAdmin}
      />
      <MovementGroup
        label={t('movement.groups.today')}
        items={props.items}
        selected={props.selected}
        onSelect={props.onSelect}
        predicate={todayPredicate}
        onEdit={props.onEdit}
        timeWithDate={false}
        createMovementFromMovement={props.createMovementFromMovement}
        onDelete={props.showDeleteConfirmationDialog}
        lockDate={props.lockDate.date}
        aircraftSettings={props.aircraftSettings}
        loading={props.loading}
        isAdmin={props.isAdmin}
      />
      <MovementGroup
        label={t('movement.groups.yesterday')}
        items={props.items}
        selected={props.selected}
        onSelect={props.onSelect}
        predicate={yesterdayPredicate}
        onEdit={props.onEdit}
        timeWithDate={false}
        createMovementFromMovement={props.createMovementFromMovement}
        onDelete={props.showDeleteConfirmationDialog}
        lockDate={props.lockDate.date}
        aircraftSettings={props.aircraftSettings}
        loading={props.loading}
        isAdmin={props.isAdmin}
      />
      <MovementGroup
        label={t('movement.groups.thisMonth')}
        items={props.items}
        selected={props.selected}
        onSelect={props.onSelect}
        predicate={thisMonthPredicate}
        onEdit={props.onEdit}
        createMovementFromMovement={props.createMovementFromMovement}
        onDelete={props.showDeleteConfirmationDialog}
        lockDate={props.lockDate.date}
        aircraftSettings={props.aircraftSettings}
        loading={props.loading}
        isAdmin={props.isAdmin}
      />
      <MovementGroup
        label={t('movement.groups.older')}
        items={props.items}
        selected={props.selected}
        onSelect={props.onSelect}
        predicate={olderPredicate}
        onEdit={props.onEdit}
        createMovementFromMovement={props.createMovementFromMovement}
        onDelete={props.showDeleteConfirmationDialog}
        lockDate={props.lockDate.date}
        aircraftSettings={props.aircraftSettings}
        loading={props.loading}
        isAdmin={props.isAdmin}
      />
      {props.loading && <LoadingInfo/>}
      {props.loadingFailed && <LoadingFailureInfo/>}
      {!props.loading && props.items.array.length === 0 && <NoMovementsInfo/>}
      {confirmationDialog}
    </div>
  );
};

(MovementList as any).propTypes = {
  loadItems: PropTypes.func.isRequired,
  loadAircraftSettings: PropTypes.func.isRequired,
  checkCustomsAvailability: PropTypes.func.isRequired,
  loadAerodromes: PropTypes.func.isRequired,
  items: PropTypes.object.isRequired,
  selected: PropTypes.string,
  onSelect: PropTypes.func,
  loading: PropTypes.bool.isRequired,
  loadingFailed: PropTypes.bool.isRequired,
  deleteConfirmation: PropTypes.object,
  deleteItem: PropTypes.func.isRequired,
  hideDeleteConfirmationDialog: PropTypes.func.isRequired,
  showDeleteConfirmationDialog: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  createMovementFromMovement: PropTypes.func.isRequired,
  lockDate: PropTypes.object.isRequired,
  aircraftSettings: PropTypes.shape({
    club: PropTypes.objectOf(PropTypes.bool),
    homeBase: PropTypes.objectOf(PropTypes.bool)
  }).isRequired,
  isAdmin: PropTypes.bool
};

export default AutoLoad(MovementList);
