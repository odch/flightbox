import React, { PropTypes, Component } from 'react';
import MovementGroup from '../MovementGroup';

/**
 * today
 * yesterday
 * this month
 * older
 */
class MovementList extends Component {

  static propTypes = {
    items: PropTypes.array,
    onClick: PropTypes.func,
  };

  static todayPredicate(movement) {
    const movementDateString = movement.departureArrival.startDate;
    return movementDateString && new Date(movementDateString).toDateString() === new Date().toDateString();
  }

  static yesterdayPredicate(movement) {
    const movementDateString = movement.departureArrival.startDate;
    if (movementDateString) {
      const today = new Date();
      today.setDate(today.getDate() - 1);
      return new Date(movementDateString).toDateString() === today.toDateString();
    }
    return false;
  }

  static thisMonthPredicate(movement) {
    const movementDateString = movement.departureArrival.startDate;
    if (movementDateString) {
      const today = new Date();
      const movementDate = new Date(movementDateString);
      if (today.getMonth() === movementDate.getMonth()
        && today.getFullYear() === movementDate.getFullYear()) {
        return true;
      }
    }
    return false;
  }

  static olderThanThisMonthPredicate(movement) {
    const movementDateString = movement.departureArrival.startDate;
    if (movementDateString) {
      const today = new Date();
      const movementDate = new Date(movementDateString);
      if (today.getMonth() > movementDate.getMonth()
        && today.getFullYear() >= movementDate.getFullYear()) {
        return true;
      }
    }
    return false;
  }

  static not(predicate) {
    return function(item) {
      return !predicate(item);
    };
  }

  static and(/* predicates */) {
    const predicates = arguments;
    return function(item) {
      for (const predicate of predicates) {
        if (!predicate(item)) {
          return false;
        }
      }
      return true;
    };
  }

  render() {
    const movementsOfToday = this.props.items.filter(MovementList.todayPredicate);
    const movementsOfYesterday = this.props.items.filter(MovementList.yesterdayPredicate);
    const movementsOfThisMonth = this.props.items.filter(MovementList.and(
      MovementList.not(MovementList.todayPredicate),
      MovementList.not(MovementList.yesterdayPredicate),
      MovementList.thisMonthPredicate)
    );
    const olderMovements = this.props.items.filter(MovementList.olderThanThisMonthPredicate);

    return (
      <div className="MovementList">
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

export default MovementList;
