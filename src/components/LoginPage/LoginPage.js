import React, { Component } from 'react';
import Header from './Header';
import Main from './Main';

const LoginPage = props => (
  <div className="LoginPage">
    <Header/>
    <Main
      authenticate={props.authenticate}
      updateUsername={props.updateUsername}
      updatePassword={props.updatePassword}
      onCancel={props.onCancel}
      showCancel={props.showCancel}
      username={props.username}
      password={props.password}
      submitting={props.submitting}
      failure={props.failure}
    />
  </div>
);

LoginPage.propTypes = {
  authenticate: React.PropTypes.func.isRequired,
  updateUsername: React.PropTypes.func.isRequired,
  updatePassword: React.PropTypes.func.isRequired,
  onCancel: React.PropTypes.func.isRequired,
  showCancel: React.PropTypes.bool.isRequired,
  username: React.PropTypes.string.isRequired,
  password: React.PropTypes.string.isRequired,
  submitting: React.PropTypes.bool.isRequired,
  failure: React.PropTypes.bool.isRequired
};

export default LoginPage;
