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
  flex-direction: column;
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

const StyledTitle = styled.div`
  text-align: center;
  margin-top: 30px;
`

const StyledFlightboxLabel = styled.div`
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.main};
`

const StyledAerodromeName = styled.div`
  font-size: 1.1rem;
  color: #666;
`

const Header = () => (
  <Wrapper>
    <StyledLogoWrapper>
      <StyledLink to="/">
        <StyledLogo className="logo"/>
      </StyledLink>
      <StyledTitle>
        <StyledFlightboxLabel>Flightbox</StyledFlightboxLabel>
        <StyledAerodromeName>{__CONF__.aerodrome.name}</StyledAerodromeName>
      </StyledTitle>
    </StyledLogoWrapper>
  </Wrapper>
);

export default Header;
