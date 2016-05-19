import React, { PropTypes, Component } from 'react';
import LoginPage from '../LoginPage';
import auth from '../../util/auth.js';
import firebase, { authenticate, unauth } from '../../util/firebase.js';
import './App.scss';
import 'moment/locale/de';


class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      /**
       * {
       *  success: true|false,
       *  type: ip|credentials,
       *  data: { // only if type credentials
       *    uid,
       *    expiration,
       *    token
       *  }
       * }
       */
      auth: null,
      showLogin: false,
    };
    this.onAuth = this.onAuth.bind(this);
  }

  componentWillMount() {
    firebase((error, ref) => {
      ref.onAuth(this.onAuth);
    });

    this.checkAuthCookie().then(cookieResult => {
      if (cookieResult.success === true) {
        this.setState({ auth: cookieResult });
      } else {
        this.loadIpToken().then(ipResult => {
          this.setState({ auth: ipResult });
        });
      }
    });
  }

  componentWillUnmount() {
    firebase((error, ref) => {
      ref.offAuth(this.onAuth);
    });
  }

  checkAuthCookie() {
    return new Promise(resolve => {
      const cookie = auth.getAuthCookie();
      if (cookie) {
        authenticate(cookie.token, (error) => {
          const success = !error;
          if (success === true) {
            resolve(this.authObj(true, 'credentials', cookie));
          } else {
            resolve(this.authObj(false, 'credentials'));
          }
        });
      } else {
        resolve(this.authObj(false, 'credentials'));
      }
    });
  }

  loadIpToken() {
    return new Promise(resolve => {
      auth.loadIpToken(ipToken => {
        if (ipToken) {
          authenticate(ipToken, (error) => {
            const success = !error;
            resolve(this.authObj(success, 'ip'));
          });
        } else {
          resolve(this.authObj(false, 'ip'));
        }
      });
    });
  }

  onAuth(authData) {
    if (!authData) { // unauth only occurs for credentials token
      auth.setAuthCookie(null);
      this.loadIpToken().then(ipResult => {
        this.setState({ auth: ipResult });
      });
    }
  }

  render() {
    if (!this.state.auth) {
      return (
        <div className="App loading">
          <div>Bitte warten ...</div>
        </div>
      );
    }

    if (this.state.auth.success !== true || this.state.showLogin === true) {
      return (
        <LoginPage
          onLogin={this.handleLogin.bind(this)}
          onCancel={this.hideLogin.bind(this)}
          showCancel={this.state.showLogin === true}
        />
      );
    }

    const childrenWithProps = React.Children.map(this.props.children,
      (child) => React.cloneElement(child, {
        auth: this.state.auth,
        onLogin: this.handleLogin.bind(this),
        onLogout: this.handleLogout.bind(this),
        showLogin: this.showLogin.bind(this),
        hideLogin: this.hideLogin.bind(this),
      })
    );

    return (
      <div className="App">
        {childrenWithProps}
      </div>
    );
  }

  handleLogout() {
    unauth();
  }

  handleLogin(authData) {
    auth.setAuthCookie(authData);
    this.setState({
      auth: this.authObj(true, 'credentials', authData),
      showLogin: false,
    });
  }

  showLogin() {
    this.setState({ showLogin: true });
  }

  hideLogin() {
    this.setState({ showLogin: false });
  }

  authObj(success, type, data) {
    return {
      success,
      type,
      data,
    };
  }
}

App.propTypes = {
  children: PropTypes.element.isRequired,
  history: PropTypes.object.isRequired,
};

export default App;
