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
      movements: [],
    };
    this.firebaseRef = new Firebase(this.props.firebaseUri);
  }

  componentWillMount() {
    this.loadData();
  }

  loadData() {
    this.firebaseRef.orderByChild('negativeTimestamp').once('value', this.onFirebaseValue, this);
  }

  onFirebaseValue(snapshot) {
    const movements = [];
    snapshot.forEach((data) => {
      const movement = firebaseToLocal(data.val());
      movement.key = data.key();
      movements.push(movement);
    });
    this.setState({ movements: this.state.movements.concat(movements) });
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

    const className = 'MovementList ' + this.props.className;

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
