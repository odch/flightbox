import React from 'react';
import Header from './Header';
import EmailLoginForm from '../../containers/EmailLoginFormContainer'
import UsernamePasswordLoginForm from '../../containers/UsernamePasswordLoginFormContainer'

const LoginPage = () => (
  <div className="LoginPage">
    <Header/>
    {__CONF__.loginForm === 'email' ? <EmailLoginForm/> : <UsernamePasswordLoginForm/>}
  </div>
);

export default LoginPage;
