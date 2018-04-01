import PropTypes from 'prop-types';
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
  authenticate: PropTypes.func.isRequired,
  updateUsername: PropTypes.func.isRequired,
  updatePassword: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  showCancel: PropTypes.bool.isRequired,
  username: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  submitting: PropTypes.bool.isRequired,
  failure: PropTypes.bool.isRequired
};

export default LoginPage;
