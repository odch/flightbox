import React, { PropTypes, Component } from 'react';
import Firebase from 'firebase';
import MovementsArray from '../../util/MovementsArray.js';
import { firebaseToLocal, localToFirebase, compareDescending } from '../../util/movements.js';
import update from 'react-addons-update';

export const AutoLoad = List => class extends Component {

  constructor(props) {
    super(props);
    this.state = {
      movements: [],
    };
    this.limit = 10;
    this.childAddedSinceLastIncrease = true;
    this.loadInProgress = false;

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
    if (this.loadInProgress === false && this.childAddedSinceLastIncrease === true) {
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
    this.loadInProgress = true;
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

    this.loadInProgress = false;
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

  render() {
    return (
      <div className={this.props.className} ref={(element) => this.element = element}>
        <List {...this.props} movements={this.state.movements}/>
      </div>
    );
  }
};

AutoLoad.propTypes = {
  firebaseUri: PropTypes.string,
  className: PropTypes.string,
};
