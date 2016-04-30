import React, { PropTypes, Component } from 'react';
import AppFailed from './AppFailed.js';
import AppLoading from './AppLoading.js';
import auth from '../../util/auth.js';
import firebase from '../../util/firebase.js';
import './App.scss';
import 'moment/locale/de';


const AuthenticationApp = (App) => class extends Component {

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
      return <AppFailed/>;
    }

    if (this.state.loaded !== true) {
      return <AppLoading/>;
    }

    return (
      <App>
        {this.props.children}
      </App>
    );
  }
};

AuthenticationApp.propTypes = {
  children: PropTypes.element.isRequired,
};

export default AuthenticationApp;
