import PropTypes from 'prop-types';
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

const StyledLogoWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`

const StyledLoginInfo = styled(LoginInfo)`
  float: right;
`;

const StyledLogo = styled(Logo)`
  height: ${props => props.theme.logoSize || 85}%;
`;

class Header extends React.PureComponent {

  render() {
    const props = this.props;
    return (
      <StyledHeader>
        <StyledLoginInfo logout={props.logout} auth={props.auth} showLogin={props.showLogin}/>
        <StyledLogoWrapper>
          <StyledLogo/>
        </StyledLogoWrapper>
      </StyledHeader>
    );
  }
}

Header.propTypes = {
  auth: PropTypes.object.isRequired,
  logout: PropTypes.func.isRequired,
  showLogin: PropTypes.func.isRequired,
};

export default Header;
