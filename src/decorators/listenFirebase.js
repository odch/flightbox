// Usage:
// Rooms = listenFirebase(Rooms, {
//   ref: firebase => firebase
//     .child('rooms-users')
//     .orderByChild('userId')
//     .equalTo(getUserId()),
//   action: onRooms,
//   props: {
//     rooms: getRooms
//   }
// })

import React from 'react';
import {firebase, onFirebaseError} from '../../firebase';

function listenFirebase(Component, {ref, action, props}) {
  return class ListenFirebase extends Component {

    // props_ because shadowing with props from listenFirebase
    constructor(props_) {
      super(props_);
      this.state = {
        // This is useful for <Loading /> component.
        firebaseLoaded: false,
      };
    }

    onFirebaseValue(snapshot) {
      this.setState({firebaseLoaded: true});
      action(snapshot);
    }

    componentWillMount() {
      // Server rendering with Firebase is not supported yet.
      if (!process.env.IS_BROWSER) return;
      this.ref = ref(firebase);
      // Always value, no need for add_child etc. granularity.
      this.ref.on('value', this.onFirebaseValue, onFirebaseError, this);
    }

    componentWillUnmount() {
      if (!process.env.IS_BROWSER) return;
      this.ref.off('value', this.onFirebaseValue, this);
    }

    render() {
      const dataProps = {};
      Object.keys(props).forEach(prop => dataProps[prop] = props[prop]());
      // Must be first to be overridable.
      return <Component {...dataProps} {...this.props} {...this.state} />;
    }
  };
}

export default listenFirebase;
