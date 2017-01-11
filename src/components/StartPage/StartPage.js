import React, {Component} from 'react';
import Header from './Header';
import Main from './Main';

const StartPage = props => (
  <div className="StartPage">
    <Header logout={props.logout} auth={props.auth} showLogin={props.showLogin}/>
    <Main admin={props.auth.data.admin === true}/>
  </div>
);

StartPage.propTypes = {
  auth: React.PropTypes.object.isRequired,
  logout: React.PropTypes.func.isRequired,
  showLogin: React.PropTypes.func.isRequired,
};

export default StartPage;
