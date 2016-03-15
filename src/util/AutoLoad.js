import React, { PropTypes, Component } from 'react';
import Firebase from 'firebase';
import ItemsArray from './ItemsArray.js';
import update from 'react-addons-update';

export const AutoLoad = (List) => class extends Component {

  constructor(props) {
    super(props);
    this.state = {
      items: [],
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
    window.requestAnimationFrame(() => {
      if (this.loadInProgress === false && this.childAddedSinceLastIncrease === true) {
        const scrollableElement = this.findScrollableElement();
        if (scrollableElement && this.isEndReached(scrollableElement)) {
          this.loadLimited();
        }
      }
    });
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

    const items = this.state.items;

    let i = items.length;
    while (i > 0) {
      const negTs = this.localToFirebase(items[i - 1]).negativeTimestamp;
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
    const items = new ItemsArray(this.state.items, this.getComparator());

    let childAddedSinceLastIncrease = false;

    snapshot.forEach((data) => {
      const item = this.firebaseToLocal(data.val());
      item.key = data.key();

      const inserted = items.insert(item);
      if (inserted === true) {
        childAddedSinceLastIncrease = true;
      }
    });

    this.childAddedSinceLastIncrease = childAddedSinceLastIncrease;
    if (childAddedSinceLastIncrease === true) {
      this.setState({
        items: items.array,
      });
    }

    this.loadInProgress = false;
  }

  onFirebaseChildAdded(data) {
    const addedItem = this.firebaseToLocal(data.val());
    addedItem.key = data.key();

    if (this.shouldItemBeVisible(addedItem)) {
      const items = new ItemsArray(this.state.items, this.getComparator());

      const inserted = items.insert(addedItem);

      if (inserted === true) {
        this.setState({
          items: items.array,
        });
      }
    }
  }

  shouldItemBeVisible(item) {
    if (this.state.items.length > 2) {
      const oldestItem = this.state.items[this.state.items.length - 1];

      if (this.getComparator()(item, oldestItem) === -1) {
        return true;
      }
    }
    return this.childAddedSinceLastIncrease === false;
  }

  onFirebaseChildRemoved(data) {
    const index = this.state.items.findIndex(item => item.key === data.key());
    if (index > -1) {
      this.setState({
        items: update(this.state.items, { $splice: [[index, 1]] }),
      });
    }
  }

  localToFirebase(item) {
    if (typeof this.props.localToFirebase === 'function') {
      return this.props.localToFirebase(item);
    }
    return item;
  }

  firebaseToLocal(item) {
    if (typeof this.props.firebaseToLocal === 'function') {
      return this.props.firebaseToLocal(item);
    }
    return item;
  }

  getComparator() {
    if (typeof this.props.comparator === 'function') {
      return this.props.comparator;
    }
    return (a, b) => {
      return this.localToFirebase(a).negativeTimestamp - this.localToFirebase(b).negativeTimestamp;
    };
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
        <List {...this.props} items={this.state.items}/>
      </div>
    );
  }
};

AutoLoad.propTypes = {
  firebaseUri: PropTypes.string.isRequired,
  comparator: PropTypes.func,
  firebaseToLocal: PropTypes.func,
  localToFirebase: PropTypes.func,
  className: PropTypes.string,
};
