import React from 'react';
import styled from 'styled-components';
import {Link} from 'react-router-dom';
import Logo from '../Logo';

const Wrapper = styled.header`
  position: absolute;
  height: 25%;
  width: 100%;
  background-color: ${props => props.theme.colors.background};
  padding: 10px;
  box-sizing: border-box;
`;

const StyledLogoWrapper = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
`;

const StyledLink = styled(Link)`
  height: ${props => props.theme.logoSize || 85}%;
`;

const StyledLogo = styled(Logo)`
  height: 100%;
`;

const Header = () => (
  <Wrapper>
    <StyledLogoWrapper>
      <StyledLink to="/">
        <StyledLogo className="logo"/>
      </StyledLink>
    </StyledLogoWrapper>
  </Wrapper>
);

export default Header;
