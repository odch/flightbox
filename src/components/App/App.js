import React, { PropTypes, Component } from 'react';
import auth from '../../util/auth.js';
import firebase from '../../util/firebase.js';
import './App.scss';
import 'moment/locale/de';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      failure: false,
    };
  }

  componentWillMount() {
    auth.loadIpToken(ipToken => {
      auth.setIpToken(ipToken);
      firebase('/', ipToken, (error, ref, authData) => {
        if (error) {
          this.setState({ failure: true });
        } else {
          this.setState({ loaded: true });
        }
      });
    });
  }

  render() {
    if (this.state.failure === true) {
      return (
        <div className="App failure">
          <div>Es ist ein Fehler aufgetreten.</div>
        </div>
      );
    }

    if (this.state.loaded !== true) {
      return (
        <div className="App loading">
          <div>Bitte warten ...</div>
        </div>
      );
    }

    return (
      <div className="App">
        {this.props.children}
      </div>
    );
  }
}

App.propTypes = {
  children: PropTypes.element.isRequired,
};

export default App;

