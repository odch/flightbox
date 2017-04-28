import React, { PropTypes, Component } from 'react';
import Predicates from './Predicates';
import MovementGroup from './MovementGroup';
import LoadingInfo from './LoadingInfo';
import LoadingFailureInfo from './LoadingFailureInfo';
import MovementDeleteConfirmationDialog from '../MovementDeleteConfirmationDialog';
import { AutoLoad } from '../../util/AutoLoad';

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
    this.props.monitorItems();
    this.props.onSelect(null);
    if (this.props.items.length === 0) {
      this.props.loadItems();
    }
  }

  render() {
    if (this.props.lockDate.loading === true) {
      return <LoadingInfo/>;
    }

    const confirmationDialog = this.props.deleteConfirmation ?
      (<MovementDeleteConfirmationDialog
        item={this.props.deleteConfirmation}
        confirm={this.props.deleteItem}
        hide={this.props.hideDeleteConfirmationDialog}
      />) : null;

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
          onAction={this.props.onAction}
          actionIcon={this.props.actionIcon}
          actionLabel={this.props.actionLabel}
          onDelete={this.props.showDeleteConfirmationDialog}
          lockDate={this.props.lockDate.date}
        />
        <MovementGroup
          label="Heute"
          items={this.props.items}
          selected={this.props.selected}
          onSelect={this.props.onSelect}
          predicate={todayPredicate}
          onEdit={this.props.onEdit}
          timeWithDate={false}
          onAction={this.props.onAction}
          actionIcon={this.props.actionIcon}
          actionLabel={this.props.actionLabel}
          onDelete={this.props.showDeleteConfirmationDialog}
          lockDate={this.props.lockDate.date}
        />
        <MovementGroup
          label="Gestern"
          items={this.props.items}
          selected={this.props.selected}
          onSelect={this.props.onSelect}
          predicate={yesterdayPredicate}
          onEdit={this.props.onEdit}
          timeWithDate={false}
          onAction={this.props.onAction}
          actionIcon={this.props.actionIcon}
          actionLabel={this.props.actionLabel}
          onDelete={this.props.showDeleteConfirmationDialog}
          lockDate={this.props.lockDate.date}
        />
        <MovementGroup
          label="Dieser Monat"
          items={this.props.items}
          selected={this.props.selected}
          onSelect={this.props.onSelect}
          predicate={thisMonthPredicate}
          onEdit={this.props.onEdit}
          onAction={this.props.onAction}
          actionIcon={this.props.actionIcon}
          actionLabel={this.props.actionLabel}
          onDelete={this.props.showDeleteConfirmationDialog}
          lockDate={this.props.lockDate.date}
        />
        <MovementGroup
          label="Älter"
          items={this.props.items}
          selected={this.props.selected}
          onSelect={this.props.onSelect}
          predicate={olderPredicate}
          onEdit={this.props.onEdit}
          onAction={this.props.onAction}
          actionIcon={this.props.actionIcon}
          actionLabel={this.props.actionLabel}
          onDelete={this.props.showDeleteConfirmationDialog}
          lockDate={this.props.lockDate.date}
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
  monitorItems: PropTypes.func.isRequired,
  items: PropTypes.array.isRequired,
  selected: PropTypes.string,
  onSelect: PropTypes.func,
  loading: PropTypes.bool.isRequired,
  loadingFailed: PropTypes.bool.isRequired,
  deleteConfirmation: PropTypes.object,
  deleteItem: PropTypes.func.isRequired,
  hideDeleteConfirmationDialog: PropTypes.func.isRequired,
  showDeleteConfirmationDialog: React.PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onAction: PropTypes.func,
  actionIcon: PropTypes.string,
  actionLabel: PropTypes.string,
  lockDate: PropTypes.object.isRequired,
};

export default AutoLoad(MovementList);
