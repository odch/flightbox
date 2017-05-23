import React, { PropTypes, Component } from 'react';
import Predicates from './Predicates';
import MovementGroup from './MovementGroup';
import LoadingInfo from './LoadingInfo';
import LoadingFailureInfo from './LoadingFailureInfo';
import MovementDeleteConfirmationDialog from '../MovementDeleteConfirmationDialog';
import { AutoLoad } from '../../util/AutoLoad';
import dates from '../../util/dates';

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
class MovementList extends React.PureComponent {

  componentWillMount() {
    this.props.loadAircraftSettings();
    this.props.onSelect(null);
    this.props.loadItems(true);
  }

  getDateString(movement) {
    const date = dates.formatDate(movement.date);
    const time = dates.formatTime(movement.date, movement.time);
    return `${date} ${time}`;
  }

  render() {
    if (this.props.lockDate.loading === true
      || !this.props.aircraftSettings.club
      || !this.props.aircraftSettings.homeBase) {
      return <LoadingInfo/>;
    }

    const confirmationDialog = this.props.deleteConfirmation ?
      (<MovementDeleteConfirmationDialog
        item={this.props.deleteConfirmation}
        confirm={this.props.deleteItem}
        hide={this.props.hideDeleteConfirmationDialog}
      />) : null;

    const oldestMovementDate = this.props.items.array.length > 0
      ? this.getDateString(this.props.items.array[this.props.items.array.length - 1])
      : null;

    return (
      <div>
        <MovementGroup
          label="Ab morgen"
          items={this.props.items}
          selected={this.props.selected}
          onSelect={this.props.onSelect}
          predicate={afterTodayPredicate}
          onEdit={this.props.onEdit}
          timeWithDate={true}
          createMovementFromMovement={this.props.createMovementFromMovement}
          onDelete={this.props.showDeleteConfirmationDialog}
          lockDate={this.props.lockDate.date}
          aircraftSettings={this.props.aircraftSettings}
          oldestMovementDate={oldestMovementDate}
          loadMovements={this.props.loadItems}
          loading={this.props.loading}
        />
        <MovementGroup
          label="Heute"
          items={this.props.items}
          selected={this.props.selected}
          onSelect={this.props.onSelect}
          predicate={todayPredicate}
          onEdit={this.props.onEdit}
          timeWithDate={false}
          createMovementFromMovement={this.props.createMovementFromMovement}
          onDelete={this.props.showDeleteConfirmationDialog}
          lockDate={this.props.lockDate.date}
          aircraftSettings={this.props.aircraftSettings}
          oldestMovementDate={oldestMovementDate}
          loadMovements={this.props.loadItems}
          loading={this.props.loading}
        />
        <MovementGroup
          label="Gestern"
          items={this.props.items}
          selected={this.props.selected}
          onSelect={this.props.onSelect}
          predicate={yesterdayPredicate}
          onEdit={this.props.onEdit}
          timeWithDate={false}
          createMovementFromMovement={this.props.createMovementFromMovement}
          onDelete={this.props.showDeleteConfirmationDialog}
          lockDate={this.props.lockDate.date}
          aircraftSettings={this.props.aircraftSettings}
          oldestMovementDate={oldestMovementDate}
          loadMovements={this.props.loadItems}
          loading={this.props.loading}
        />
        <MovementGroup
          label="Dieser Monat"
          items={this.props.items}
          selected={this.props.selected}
          onSelect={this.props.onSelect}
          predicate={thisMonthPredicate}
          onEdit={this.props.onEdit}
          createMovementFromMovement={this.props.createMovementFromMovement}
          onDelete={this.props.showDeleteConfirmationDialog}
          lockDate={this.props.lockDate.date}
          aircraftSettings={this.props.aircraftSettings}
          oldestMovementDate={oldestMovementDate}
          loadMovements={this.props.loadItems}
          loading={this.props.loading}
        />
        <MovementGroup
          label="Älter"
          items={this.props.items}
          selected={this.props.selected}
          onSelect={this.props.onSelect}
          predicate={olderPredicate}
          onEdit={this.props.onEdit}
          createMovementFromMovement={this.props.createMovementFromMovement}
          onDelete={this.props.showDeleteConfirmationDialog}
          lockDate={this.props.lockDate.date}
          aircraftSettings={this.props.aircraftSettings}
          oldestMovementDate={oldestMovementDate}
          loadMovements={this.props.loadItems}
          loading={this.props.loading}
        />
        {this.props.loading && <LoadingInfo/>}
        {this.props.loadingFailed && <LoadingFailureInfo/>}
        {confirmationDialog}
      </div>
    );
  }
}

MovementList.propTypes = {
  loadItems: PropTypes.func.isRequired,
  loadAircraftSettings: PropTypes.func.isRequired,
  items: PropTypes.object.isRequired,
  selected: PropTypes.string,
  onSelect: PropTypes.func,
  loading: PropTypes.bool.isRequired,
  loadingFailed: PropTypes.bool.isRequired,
  deleteConfirmation: PropTypes.object,
  deleteItem: PropTypes.func.isRequired,
  hideDeleteConfirmationDialog: PropTypes.func.isRequired,
  showDeleteConfirmationDialog: React.PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  createMovementFromMovement: PropTypes.func.isRequired,
  lockDate: PropTypes.object.isRequired,
  aircraftSettings: PropTypes.shape({
    club: PropTypes.objectOf(PropTypes.bool),
    homeBase: PropTypes.objectOf(PropTypes.bool)
  }).isRequired
};

export default AutoLoad(MovementList);
