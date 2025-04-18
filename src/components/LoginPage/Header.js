import React from 'react';
import styled from 'styled-components';
import {Link} from 'react-router-dom';
import Logo from '../Logo';

const Wrapper = styled.header`
  background-color: ${props => props.theme.colors.background};
  padding: 10px;
  width: 40%;

  @media screen and (max-width: 520px) {
    & {
      width: 100%;
    }
  }
`;

const StyledLogoWrapper = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  @media screen and (max-width: 520px) {
    & {
      justify-content: start;
    }
  }
`;

const StyledLink = styled(Link)`
`;

const StyledLogo = styled(Logo)`
  height: 100px;
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
