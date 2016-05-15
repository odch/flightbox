import React, { Component } from 'react';
import './LoginPage.scss';
import LabeledComponent from '../LabeledComponent';
import auth from '../../util/auth';
import firebase from '../../util/firebase';

class LoginPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      failure: false,
      submitting: false,
      username: '',
      password: '',
    };
  }

  render() {
    const { username, password, submitting, failure } = this.state;
    const logoImagePath = require('../../resources/mfgt_logo_transp.png');
    const usernameInput = (
      <input
        type="text"
        value={username}
        autoFocus={true}
        readOnly={submitting}
        onChange={this.updateUsername.bind(this)}
      />
    );
    const passwordInput = (
      <input
        type="password"
        value={password}
        readOnly={submitting}
        onChange={this.updatePassword.bind(this)}
      />
    );
    return (
      <div className="LoginPage">
        <header>
          <a href="#/"><img className="logo" src={logoImagePath}/></a>
        </header>
        <div className="main">
          <form onSubmit={this.handleSubmit.bind(this)}>
            <LabeledComponent label="Benutzername" component={usernameInput}/>
            <LabeledComponent label="Passwort" component={passwordInput}/>
            {failure && <div className="failure">Login fehlgeschlagen</div>}
            <a href="#/">Abbrechen</a>
            <button type="submit" disabled={submitting || username.length === 0 || password.length === 0}>
              <i className="material-icons">send</i>&nbsp;Anmelden
            </button>
          </form>
        </div>
      </div>
    );
  }

  updateUsername(e) {
    this.setState({ username: e.target.value });
  }

  updatePassword(e) {
    this.setState({ password: e.target.value });
  }

  handleSubmit(e) {
    e.preventDefault();
    this.setState({ submitting: true });
    const cred = {
      username: this.state.username,
      password: this.state.password,
    };
    auth.loadCredentialsToken(cred, token => {
      if (token) {
        firebase('/', token, (error, ref, authData) => {
          if (error) {
            this.fail();
          } else {
            auth.setCredentialsAuth({
              uid: authData.uid,
              expiration: new Date(authData.expires * 1000),
              token,
            });
            this.setState({ submitting: false });
            window.location.hash = '/';
          }
        });
      } else {
        this.fail();
      }
    });
  }

  fail() {
    this.setState({
      failure: true,
      submitting: false,
      password: '',
    });
  }
}

export default LoginPage;
