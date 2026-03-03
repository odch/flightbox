import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';
import {Link} from 'react-router-dom'
import { withTranslation } from 'react-i18next'

const StyledWrapper = styled.div`
  position: relative
`

const UserName = styled.span`
  margin-right: 0.3em;

  @media (max-width: 500px) {
    display: none;
  }
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

const StyledUserNameWrapper = styled.div`
  cursor: pointer;
`

const StyledMenuButton = styled.button`
  padding: 3px;
  border: none;
  border-radius: 5px;
  font-size: 1em;
  background-color: transparent;
  cursor: pointer;
  font-weight: bold;
  display: block;
  margin: 3px 0;
  color: black;
`;

const StyledMenuUsername = styled.div`
  padding: 7px 3px;
  font-size: 1em;
  font-weight: bold;
  margin-bottom: 7px;
  border-bottom: 1px solid #ddd;
  color: #666;
  display: none;
  text-decoration: none;

  @media (max-width: 500px) {
    display: block;
  }
`;

const StyledMenuLink = styled(Link)`
  padding: 3px;
  border: none;
  border-radius: 5px;
  font-size: 1em;
  background-color: transparent;
  cursor: pointer;
  font-weight: bold;
  display: block;
  margin: 3px 0;
`;

const StyledMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 150px;
  margin-top: 5px;
  background-color: rgb(255, 255, 255);
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px;
`

const getUsername = (authData, t) => {
  if (authData.email) {
    return authData.email
  }
  if (authData.guest === true) {
    return t('login.guest')
  }
  if (authData.kiosk === true) {
    return t('login.kiosk')
  }
  return authData.uid
}

class LoginInfo extends React.Component<any, any> {
  menuRef: any;

  constructor(props) {
    super(props)

    this.handleUserNameClick = this.handleUserNameClick.bind(this)
    this.handleClickOutside = this.handleClickOutside.bind(this)
    this.setMenuRef = this.setMenuRef.bind(this);

    this.state = {
      menuOpen: false
    }
  }

  handleUserNameClick(e) {
    e.stopPropagation();
    this.setState(prevState => ({ menuOpen: !prevState.menuOpen }), () => {
      if (this.state.menuOpen) {
        document.addEventListener('click', this.handleClickOutside);
      } else {
        document.removeEventListener('click', this.handleClickOutside);
      }
    });
  }

  handleClickOutside(event) {
    if (this.menuRef && !this.menuRef.contains(event.target)) {
      this.setState({ menuOpen: false });
      document.removeEventListener('click', this.handleClickOutside);
    }
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }

  setMenuRef(node) {
    this.menuRef = node;
  }

  render() {
    const props = this.props;
    const { t } = props;

    if (props.auth.authenticated === true && typeof props.auth.data.uid === 'string') {
      return (
        <StyledWrapper className={props.className} data-cy="login-info">
          <StyledUserNameWrapper onClick={this.handleUserNameClick}>
            <MaterialIcon icon="account_box"/>
            <UserName>{getUsername(props.auth.data, t)}</UserName>
          </StyledUserNameWrapper>
          {this.state.menuOpen && props.auth.data.links !== false && this.renderMenu()}
        </StyledWrapper>
      );
    }

    return (
      <div className={props.className}>
        <Button onClick={props.showLogin}>{t('common.login')}</Button>
      </div>
    );
  }

  renderMenu() {
    const auth = this.props.auth.data;
    const { t } = this.props;
    return (
      <StyledMenu ref={this.setMenuRef}>
        <StyledMenuUsername>{getUsername(auth, t)}</StyledMenuUsername>
        {auth && auth.guest !== true && auth.kiosk !== true && auth.uid !== 'ipauth' && (
          <StyledMenuLink to="/profile" data-cy="profile">{t('login.profile')}</StyledMenuLink>
        )}
        <StyledMenuButton onClick={this.props.logout} data-cy="logout">{t('login.logout')}</StyledMenuButton>
      </StyledMenu>
    )
  }
}

(LoginInfo as any).propTypes = {
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

export default withTranslation()(LoginInfo);
