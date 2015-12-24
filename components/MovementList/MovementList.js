import React, { PropTypes, Component } from 'react';
import Predicates from './Predicates.js';
import MovementGroup from '../MovementGroup';
import Firebase from 'firebase';
import { firebaseToLocal } from '../../util/movements.js';

/**
 * today
 * yesterday
 * this month
 * older
 */
class MovementList extends Component {

  constructor(props) {
    super(props);
    this.state = {
      movements: []
    };
  }

  componentWillMount() {
    this.firebaseRef = new Firebase(this.props.firebaseUri);
    this.firebaseRef.orderByKey().on('child_added', this.onFirebaseChildAdded, this);
  }

  componentWillUnmount() {
    this.firebaseRef.off('child_added', this.onFirebaseChildAdded, this);
  }

  onFirebaseChildAdded(dataSnapshot) {
    const movement = firebaseToLocal(dataSnapshot.val());
    movement.key = dataSnapshot.key();
    this.setState({ movements: this.state.movements.concat([movement]) });
  }

  render() {
    const movementsOfToday = this.state.movements.filter(Predicates.today);
    const movementsOfYesterday = this.state.movements.filter(Predicates.yesterday);
    const movementsOfThisMonth = this.state.movements.filter(Predicates.and(
        Predicates.not(Predicates.today),
        Predicates.not(Predicates.yesterday),
        Predicates.thisMonth)
    );
    const olderMovements = this.state.movements.filter(Predicates.olderThanThisMonth);

    const className = "MovementList " + this.props.className;

    return (
      <div className={className}>
        <MovementGroup label="Heute" items={movementsOfToday} onClick={this.itemClick.bind(this)}/>
        <MovementGroup label="Gestern" items={movementsOfYesterday} onClick={this.itemClick.bind(this)}/>
        <MovementGroup label="Dieser Monat" items={movementsOfThisMonth} onClick={this.itemClick.bind(this)}/>
        <MovementGroup label="Älter" items={olderMovements} onClick={this.itemClick.bind(this)}/>
      </div>
    );
  }

  itemClick(item) {
    this.props.onClick(item);
  }
}

MovementList.propTypes = {
  className: PropTypes.string,
  firebaseUri: PropTypes.string,
  onClick: PropTypes.func,
};

export default MovementList;
