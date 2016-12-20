import React from 'react';
import styled from 'styled-components';
import LoginInfo from './LoginInfo';
import Logo from '../Logo';

const StyledHeader = styled.header`
  position: absolute;
  height: 25%;
  width: 100%;
  background-color: ${props => props.theme.colors.background};
  padding: 10px;
  box-sizing: border-box;
`;

const StyledLoginInfo = styled(LoginInfo)`
  float: right;
`;

const StyledLogo = styled(Logo)`
  height: 85%;
`;

const Header = props => (
  <StyledHeader>
    <StyledLoginInfo logout={props.logout} auth={props.auth} showLogin={props.showLogin}/>
    <StyledLogo/>
  </StyledHeader>
);

Header.propTypes = {
  auth: React.PropTypes.object.isRequired,
  logout: React.PropTypes.func.isRequired,
  showLogin: React.PropTypes.func.isRequired,
};

export default Header;
