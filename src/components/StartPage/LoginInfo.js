import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';

const UserName = styled.span`
  margin-right: 0.3em;
`;

const Button = styled.button`
  padding: 0;
  border: none;
  border-radius: 5px;
  font-size: 1em;
  background-color: transparent;
  text-decoration: underline;
  cursor: pointer;
`;

class LoginInfo extends React.PureComponent {

  render() {
    const props = this.props;

    if (props.auth.authenticated === true && typeof props.auth.data.uid === 'string') {
      return (
        <div className={props.className} data-cy="login-info">
          <MaterialIcon icon="account_box"/>
          <UserName>{props.auth.data.email || props.auth.data.uid}</UserName>
          {props.auth.data.links !== false && <Button onClick={props.logout} data-cy="logout">Abmelden</Button>}
        </div>
      );
    }

    return (
      <div className={props.className}>
        <Button onClick={props.showLogin}>Anmelden</Button>
      </div>
    );
  }
}

LoginInfo.propTypes = {
  className: PropTypes.string,
  auth: PropTypes.shape({
    authenticated: PropTypes.bool.isRequired,
    data: PropTypes.shape({
      uid: PropTypes.string,
      links: PropTypes.bool
    })
  }).isRequired,
  logout: PropTypes.func.isRequired,
  showLogin: PropTypes.func.isRequired,
};

export default LoginInfo;
