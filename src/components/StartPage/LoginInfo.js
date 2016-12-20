import React from 'react';
import styled from 'styled-components';

const UserName = styled.span`
  margin-right: 0.3em;
`;

const LogoutButton = styled.button`
  padding: 0;
  border: none;
  border-radius: 5px;
  font-size: 1em;
  background-color: transparent;
  text-decoration: underline;
  cursor: pointer;
`;

const LoginInfo = props => {
  if (props.auth.authenticated === true && typeof props.auth.data.uid === 'string') {
    return (
      <div className={props.className}>
        <i className="material-icons">account_box</i>
        <UserName>{props.auth.data.uid}</UserName>
        <LogoutButton onClick={props.logout}>Abmelden</LogoutButton>
      </div>
    );
  }

  return (
    <div className={props.className}>
      <button onClick={props.showLogin}>Anmelden</button>
    </div>
  );
};

LoginInfo.propTypes = {
  className: React.PropTypes.string,
  auth: React.PropTypes.object.isRequired,
  logout: React.PropTypes.func.isRequired,
  showLogin: React.PropTypes.func.isRequired,
};

export default LoginInfo;
