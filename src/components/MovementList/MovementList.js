import React, { PropTypes, Component } from 'react';
import Predicates from './Predicates.js';
import MovementGroup from '../MovementGroup';
import MovementDeleteConfirmationDialog from '../MovementDeleteConfirmationDialog';
import firebase from '../../util/firebase.js';
import { AutoLoad } from '../../util/AutoLoad.js';

const LoadingInfo = () => (
  <div className="LoadingInfo">Bewegungen werden geladen ...</div>
);

/**
 * today
 * yesterday
 * this month
 * older
 */
class MovementList extends Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillMount() {
    if (this.props.items.length === 0) {
      this.props.loadItems();
    }
  }

  onListDeleteTrigger(item) {
    this.setState({
      deleteConfirmation: item,
    });
  }

  onDeleteConfirmation(item) {
    firebase(this.props.firebaseUri, (error, ref) => {
      ref.child(item.key).remove();
      this.setState({
        deleteConfirmation: null,
      });
    });
  }

  onDeleteCancel() {
    this.setState({
      deleteConfirmation: null,
    });
  }

  render() {
    if (this.props.lockDate.loading === true) {
      return <LoadingInfo/>;
    }

    const movements = this.props.items;

    const movementsAfterToday = movements.filter(Predicates.newerThanSameDay());
    const movementsOfToday = movements.filter(Predicates.sameDay());
    const movementsOfYesterday = movements.filter(Predicates.dayBefore());
    const movementsOfThisMonth = movements.filter(Predicates.and(
      Predicates.sameMonth(),
      Predicates.olderThanSameDay(),
      Predicates.not(Predicates.dayBefore())
    ));
    const olderMovements = movements.filter(Predicates.and(
      Predicates.olderThanSameMonth(),
      Predicates.not(Predicates.dayBefore())
    ));

    const confirmationDialog = this.state.deleteConfirmation ?
      (<MovementDeleteConfirmationDialog
        item={this.state.deleteConfirmation}
        onConfirm={this.onDeleteConfirmation.bind(this)}
        onCancel={this.onDeleteCancel.bind(this)}
      />) : null;

    return (
      <div>
        <MovementGroup
          label="Ab morgen"
          items={movementsAfterToday}
          onClick={this.props.onClick}
          timeWithDate={true}
          onAction={this.props.onAction}
          actionIcon={this.props.actionIcon}
          actionLabel={this.props.actionLabel}
          onDelete={this.onListDeleteTrigger.bind(this)}
          lockDate={this.props.lockDate.date}
        />
        <MovementGroup
          label="Heute"
          items={movementsOfToday}
          onClick={this.props.onClick}
          timeWithDate={false}
          onAction={this.props.onAction}
          actionIcon={this.props.actionIcon}
          actionLabel={this.props.actionLabel}
          onDelete={this.onListDeleteTrigger.bind(this)}
          lockDate={this.props.lockDate.date}
        />
        <MovementGroup
          label="Gestern"
          items={movementsOfYesterday}
          onClick={this.props.onClick}
          timeWithDate={false}
          onAction={this.props.onAction}
          actionIcon={this.props.actionIcon}
          actionLabel={this.props.actionLabel}
          onDelete={this.onListDeleteTrigger.bind(this)}
          lockDate={this.props.lockDate.date}
        />
        <MovementGroup
          label="Dieser Monat"
          items={movementsOfThisMonth}
          onClick={this.props.onClick}
          onAction={this.props.onAction}
          actionIcon={this.props.actionIcon}
          actionLabel={this.props.actionLabel}
          onDelete={this.onListDeleteTrigger.bind(this)}
          lockDate={this.props.lockDate.date}
        />
        <MovementGroup
          label="Älter"
          items={olderMovements}
          onClick={this.props.onClick}
          onAction={this.props.onAction}
          actionIcon={this.props.actionIcon}
          actionLabel={this.props.actionLabel}
          onDelete={this.onListDeleteTrigger.bind(this)}
          lockDate={this.props.lockDate.date}
        />
        {this.props.loading && <LoadingInfo/>}
        {confirmationDialog}
      </div>
    );
  }
}

MovementList.propTypes = {
  loadItems: PropTypes.func.isRequired,
  items: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  firebaseUri: PropTypes.string,
  onClick: PropTypes.func,
  onAction: PropTypes.func,
  actionIcon: PropTypes.string,
  actionLabel: PropTypes.string,
  lockDate: PropTypes.object.isRequired,
};

export default AutoLoad(MovementList);
