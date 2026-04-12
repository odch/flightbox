import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import LoginInfo from './LoginInfo';
import Logo from '../Logo';
import LanguageSwitch from '../LanguageSwitch';

const StyledHeader = styled.header`
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  background-color: ${props => props.theme.colors.background};
  padding: 10px;
  box-sizing: border-box;
  box-shadow: rgba(0, 0, 0, 0.117647) 0px 1px 6px, rgba(0, 0, 0, 0.117647) 0px 1px 4px;
`;

const StyledLogoWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`

const StyledTopRight = styled.div`
  float: right;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StyledLogo = styled(Logo)`
  height: 50px;
`;

const StyledTitle = styled.div`
  margin-left: 1.5rem;
`

const StyledFlightboxLabel = styled.div`
  font-size: 1.2rem;
  margin-bottom: 0.3rem;
  color: ${props => props.theme.colors.main};
`

const StyledAerodromeName = styled.div`
  color: #666;
`

const Header = ({ auth, logout, showLogin }: any) => (
  <StyledHeader>
    <StyledTopRight>
      <LanguageSwitch/>
      <LoginInfo logout={logout} auth={auth} showLogin={showLogin}/>
    </StyledTopRight>
    <StyledLogoWrapper>
      <StyledLogo/>
      <StyledTitle>
        <StyledFlightboxLabel>Flightbox</StyledFlightboxLabel>
        <StyledAerodromeName>{__CONF__.aerodrome.name}</StyledAerodromeName>
      </StyledTitle>
    </StyledLogoWrapper>
  </StyledHeader>
);

Header.propTypes = {
  auth: PropTypes.object.isRequired,
  logout: PropTypes.func.isRequired,
  showLogin: PropTypes.func.isRequired,
};

export default Header;
