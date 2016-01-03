import React, { PropTypes, Component } from 'react';
import Predicates from './Predicates.js';
import MovementGroup from '../MovementGroup';
import Firebase from 'firebase';
import MovementsArray from '../../util/MovementsArray.js';
import { firebaseToLocal } from '../../util/movements.js';
import dates from '../../core/dates.js';

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
    this.increase = 50;
    this.limit = this.increase;
    this.childAddedSinceLastIncrease = true;

    this.handleScroll = this.handleScroll.bind(this);
  }

  componentWillMount() {
    this.loadOnceOfToday();
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    this.tearDownFirebase();
    window.removeEventListener('scroll', this.handleScroll);
  }

  tearDownFirebase() {
    if (this.firebaseRef) {
      this.firebaseRef.off('child_added', this.onFirebaseChildAdded, this);
    }
  }

  loadOnceOfToday() {
    new Firebase(this.props.firebaseUri)
      .orderByChild('dateTime')
      .startAt(dates.isoStartOfDay())
      .endAt(dates.isoEndOfDay())
      .once('value', this.initialValues, this);
  }

  loadContinuouslyLimited() {
    this.tearDownFirebase();
    this.firebaseRef = new Firebase(this.props.firebaseUri)
      .orderByChild('negativeTimestamp')
      .limitToFirst(this.limit);
    this.firebaseRef.on('child_added', this.onFirebaseChildAdded, this);
  }

  initialValues(snapshot) {
    const movements = [];
    snapshot.forEach((data) => {
      const movement = firebaseToLocal(data.val());
      movement.key = data.key();

      movements.unshift(movement);
    });
    this.setState({
      movements,
    }, () => {
      this.loadContinuouslyLimited();
    }, this);
  }

  onFirebaseChildAdded(data) {
    const addedMovement = firebaseToLocal(data.val());
    addedMovement.key = data.key();

    const sorted = new MovementsArray(this.state.movements);
    const inserted = sorted.insert(addedMovement);

    if (inserted) {
      this.childAddedSinceLastIncrease = true;
      this.setState({ movements: sorted.array });
    }
  }

  handleScroll() {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight
      && this.childAddedSinceLastIncrease === true) {
      this.increaseLimit();
    }
  }

  increaseLimit() {
    this.limit += this.increase;
    this.childAddedSinceLastIncrease = false;
    this.loadContinuouslyLimited();
  }

  render() {
    const movementsOfToday = this.state.movements.filter(Predicates.sameDay());
    const movementsOfYesterday = this.state.movements.filter(Predicates.dayBefore());
    const movementsOfThisMonth = this.state.movements.filter(Predicates.and(
      Predicates.sameMonth(),
      Predicates.olderThanSameDay(),
      Predicates.not(Predicates.dayBefore())
    ));
    const olderMovements = this.state.movements.filter(Predicates.and(
      Predicates.olderThanSameMonth(),
      Predicates.not(Predicates.dayBefore())
    ));

    const className = 'MovementList ' + this.props.className;

    return (
      <div className={className}>
        <MovementGroup
          label="Heute"
          items={movementsOfToday}
          onClick={this.props.onClick}
          timeWithDate={false}
          onAction={this.props.onAction}
          actionLabel={this.props.actionLabel}
        />
        <MovementGroup
          label="Gestern"
          items={movementsOfYesterday}
          onClick={this.props.onClick}
          timeWithDate={false}
          onAction={this.props.onAction}
          actionLabel={this.props.actionLabel}
        />
        <MovementGroup
          label="Dieser Monat"
          items={movementsOfThisMonth}
          onClick={this.props.onClick}
          onAction={this.props.onAction}
          actionLabel={this.props.actionLabel}
        />
        <MovementGroup
          label="Älter"
          items={olderMovements}
          onClick={this.props.onClick}
          onAction={this.props.onAction}
          actionLabel={this.props.actionLabel}
        />
      </div>
    );
  }
}

MovementList.propTypes = {
  className: PropTypes.string,
  firebaseUri: PropTypes.string,
  onClick: PropTypes.func,
  onAction: PropTypes.func,
  actionLabel: PropTypes.element,
};

export default MovementList;
