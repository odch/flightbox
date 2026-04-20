import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';
import {Link} from 'react-router-dom'
import { useTranslation } from 'react-i18next'

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

const getUsername = (authData: any, t: (key: string) => string) => {
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

const LoginInfo = (props: any) => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  const handleUserNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(prev => !prev);
  };

  const renderMenu = () => {
    const auth = props.auth.data;
    return (
      <StyledMenu ref={menuRef}>
        <StyledMenuUsername>{getUsername(auth, t)}</StyledMenuUsername>
        {(typeof __CONF__ === 'undefined' || __CONF__.profileEnabled !== false) && auth && auth.guest !== true && auth.kiosk !== true && auth.uid !== 'ipauth' && (
          <StyledMenuLink to="/profile" data-cy="profile">{t('login.profile')}</StyledMenuLink>
        )}
        <StyledMenuButton onClick={props.logout} data-cy="logout">{t('login.logout')}</StyledMenuButton>
      </StyledMenu>
    );
  };

  if (props.auth.authenticated === true && typeof props.auth.data.uid === 'string') {
    return (
      <StyledWrapper className={props.className} data-cy="login-info">
        <StyledUserNameWrapper onClick={handleUserNameClick}>
          <MaterialIcon icon="account_box"/>
          <UserName>{getUsername(props.auth.data, t)}</UserName>
        </StyledUserNameWrapper>
        {menuOpen && props.auth.data.links !== false && renderMenu()}
      </StyledWrapper>
    );
  }

  return (
    <div className={props.className}>
      <Button onClick={props.showLogin}>{t('common.login')}</Button>
    </div>
  );
};

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

export default LoginInfo;
