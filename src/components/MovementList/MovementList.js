import React, { PropTypes, Component } from 'react';
import Predicates from './Predicates.js';
import MovementGroup from '../MovementGroup';
import MovementDeleteConfirmationDialog from '../MovementDeleteConfirmationDialog';
import Firebase from 'firebase';
import MovementsArray from '../../util/MovementsArray.js';
import { firebaseToLocal, localToFirebase, compareDescending } from '../../util/movements.js';
import update from 'react-addons-update';

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
    this.limit = 10;
    this.childAddedSinceLastIncrease = true;

    this.handleScroll = this.handleScroll.bind(this);
  }

  componentWillMount() {
    this.loadLimited();
    this.firebaseRef = new Firebase(this.props.firebaseUri);
    this.firebaseRef.on('child_added', this.onFirebaseChildAdded, this);
    this.firebaseRef.on('child_removed', this.onFirebaseChildRemoved, this);
  }

  componentDidMount() {
    const scrollableElement = this.findScrollableElement();
    if (scrollableElement) {
      scrollableElement.addEventListener('scroll', this.handleScroll);
    }
  }

  componentDidUpdate() {
    if (this.childAddedSinceLastIncrease === true) {
      const scrollableElement = this.findScrollableElement();
      if (scrollableElement && this.isEndReached(scrollableElement)) {
        this.loadLimited();
      }
    }
  }

  componentWillUnmount() {
    if (this.firebaseRef) {
      this.firebaseRef.off('child_added', this.onFirebaseChildAdded, this);
      this.firebaseRef.off('child_removed', this.onFirebaseChildRemoved, this);
    }

    const scrollableElement = this.findScrollableElement();
    if (scrollableElement) {
      scrollableElement.removeEventListener('scroll', this.handleScroll);
    }
  }

  loadLimited() {
    const pagination = this.getPagination();
    new Firebase(this.props.firebaseUri)
      .orderByChild('negativeTimestamp')
      .limitToFirst(pagination.limit)
      .startAt(pagination.start)
      .once('value', this.onFirebaseValues, this);
  }

  getPagination() {
    let limit = this.limit;
    let start = undefined;

    const movements = this.state.movements;

    let i = movements.length;
    while (i > 0) {
      const negTs = localToFirebase(movements[i - 1]).negativeTimestamp;
      if (start === undefined) {
        start = negTs;
        limit++;
      } else if (start === negTs) {
        limit++;
      } else {
        break;
      }
      i--;
    }

    return {
      start,
      limit,
    };
  }

  onFirebaseValues(snapshot) {
    const movements = new MovementsArray(this.state.movements, compareDescending);

    let childAddedSinceLastIncrease = false;

    snapshot.forEach((data) => {
      const movement = firebaseToLocal(data.val());
      movement.key = data.key();

      const inserted = movements.insert(movement);
      if (inserted === true) {
        childAddedSinceLastIncrease = true;
      }
    });

    this.childAddedSinceLastIncrease = childAddedSinceLastIncrease;
    if (childAddedSinceLastIncrease === true) {
      this.setState({
        movements: movements.array,
      });
    }
  }

  onFirebaseChildAdded(data) {
    const addedMovement = firebaseToLocal(data.val());
    addedMovement.key = data.key();

    if (this.shouldMovementBeVisible(addedMovement)) {
      const movements = new MovementsArray(this.state.movements, compareDescending);

      const inserted = movements.insert(addedMovement);

      if (inserted === true) {
        this.setState({
          movements: movements.array,
        });
      }
    }
  }

  shouldMovementBeVisible(movement) {
    if (this.state.movements.length > 2) {
      const oldestMovement = this.state.movements[this.state.movements.length - 1];

      if (compareDescending(movement, oldestMovement) === -1) {
        return true;
      }
    }
    return this.childAddedSinceLastIncrease === false;
  }

  onFirebaseChildRemoved(data) {
    const index = this.state.movements.findIndex(movement => movement.key === data.key());
    if (index > -1) {
      this.setState({
        movements: update(this.state.movements, { $splice: [[index, 1]] }),
      });
    }
  }

  findScrollableElement() {
    let element = this.element;
    do {
      const style = window.getComputedStyle(element);
      const overflow = style.getPropertyValue('overflow');
      if (overflow === 'auto' || overflow === 'scroll') {
        return element;
      }
      element = element.parentNode;
    } while (element);
    return null;
  }

  handleScroll(e) {
    if (this.isEndReached(e.target) && this.childAddedSinceLastIncrease === true) {
      this.loadLimited();
    }
  }

  isEndReached(element) {
    return element.offsetHeight + element.scrollTop === element.scrollHeight;
  }

  onListDeleteTrigger(item) {
    this.setState({
      deleteConfirmation: item,
    });
  }

  onDeleteConfirmation(item) {
    new Firebase(this.props.firebaseUri).child(item.key).remove();
    this.setState({
      deleteConfirmation: null,
    });
  }

  onDeleteCancel() {
    this.setState({
      deleteConfirmation: null,
    });
  }

  render() {
    const movementsAfterToday = this.state.movements.filter(Predicates.newerThanSameDay());
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

    const confirmationDialog = this.state.deleteConfirmation ?
      (<MovementDeleteConfirmationDialog
        item={this.state.deleteConfirmation}
        onConfirm={this.onDeleteConfirmation.bind(this)}
        onCancel={this.onDeleteCancel.bind(this)}
      />) : null;

    return (
      <div className={className} ref={(element) => this.element = element}>
        <MovementGroup
          label="Ab morgen"
          items={movementsAfterToday}
          onClick={this.props.onClick}
          timeWithDate={true}
          onAction={this.props.onAction}
          actionLabel={this.props.actionLabel}
          onDelete={this.onListDeleteTrigger.bind(this)}
          lockDate={this.props.lockDate}
        />
        <MovementGroup
          label="Heute"
          items={movementsOfToday}
          onClick={this.props.onClick}
          timeWithDate={false}
          onAction={this.props.onAction}
          actionLabel={this.props.actionLabel}
          onDelete={this.onListDeleteTrigger.bind(this)}
          lockDate={this.props.lockDate}
        />
        <MovementGroup
          label="Gestern"
          items={movementsOfYesterday}
          onClick={this.props.onClick}
          timeWithDate={false}
          onAction={this.props.onAction}
          actionLabel={this.props.actionLabel}
          onDelete={this.onListDeleteTrigger.bind(this)}
          lockDate={this.props.lockDate}
        />
        <MovementGroup
          label="Dieser Monat"
          items={movementsOfThisMonth}
          onClick={this.props.onClick}
          onAction={this.props.onAction}
          actionLabel={this.props.actionLabel}
          onDelete={this.onListDeleteTrigger.bind(this)}
          lockDate={this.props.lockDate}
        />
        <MovementGroup
          label="Älter"
          items={olderMovements}
          onClick={this.props.onClick}
          onAction={this.props.onAction}
          actionLabel={this.props.actionLabel}
          onDelete={this.onListDeleteTrigger.bind(this)}
          lockDate={this.props.lockDate}
        />
        {confirmationDialog}
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
  lockDate: PropTypes.number,
};

export default MovementList;
