import React, { PropTypes, Component } from 'react';
import firebase from '../../util/firebase.js';
import update from 'react-addons-update';
import { filter } from '../../core/filter.js';
import FirebaseKeyListItem from './FirebaseKeyListItem.js';
import './FirebaseKeyList.scss';

class FirebaseKeyList extends Component {

  constructor(props) {
    super(props);
    this.state = {
      newKey: '',
      keys: {},
    };
  }

  componentWillMount() {
    firebase(this.props.path, (error, ref) => {
      this.ref = ref;
      ref.on('child_added', this.onFirebaseChildAdded, this);
      ref.on('child_removed', this.onFirebaseChildRemoved, this);
    });
  }

  componentWillUnmount() {
    this.ref.off('child_added', this.onFirebaseChildAdded, this);
    this.ref.off('child_removed', this.onFirebaseChildRemoved, this);
  }

  onFirebaseChildAdded(snapshot) {
    this.setState({
      keys: update(this.state.keys, {
        [snapshot.key()]: { $set: true },
      }),
    });
  }

  onFirebaseChildRemoved(snapshot) {
    this.setState({
      keys: filter(this.state.keys, key => key !== snapshot.key()),
    });
  }

  render() {
    const items = this.getItems();
    return (
      <div className="FirebaseKeyList">
        <div className="input-wrap">
          <input
            type="text"
            value={this.state.newKey}
            onChange={this.onNewKeyChange.bind(this)}
            onKeyUp={this.onKeyUp.bind(this)}
          />
          <button
            onClick={this.onAddClick.bind(this)}
            className="add"
          >
            <i className="material-icons">done</i>&nbsp;Hinzufügen
          </button>
        </div>
        <div className="items-wrap">
          {items.map((item, index) => {
            return (
              <FirebaseKeyListItem
                key={index}
                label={item}
                onRemoveClick={this.onRemoveClick.bind(this, item)}
              />
            );
          })}
        </div>
      </div>
    );
  }

  getItems() {
    const arr = [];

    for (const key in this.state.keys) {
      if (this.state.keys.hasOwnProperty(key)) {
        arr.push(key);
      }
    }

    arr.sort();

    return arr;
  }

  onNewKeyChange(e) {
    const newKey = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    this.setState({
      newKey,
    });
  }

  onKeyUp(e) {
    if (e.keyCode === 13) {
      this.addItem();
    }
  }

  onAddClick() {
    this.addItem();
  }

  onRemoveClick(item) {
    this.ref.child(item).remove();
  }

  addItem() {
    if (this.state.newKey) {
      this.ref.child(this.state.newKey).set(true, error => {
        if (!error) {
          this.setState({
            newKey: '',
          });
        }
      });
    }
  }
}

FirebaseKeyList.propTypes = {
  path: PropTypes.string.isRequired,
};

export default FirebaseKeyList;
