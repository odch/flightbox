import React from 'react';
import styled from 'styled-components';
import {Link} from 'react-router-dom';
import Logo from '../Logo';

const Wrapper = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 120px;
  box-sizing: border-box;
  background-color: ${props => props.theme.colors.background};
  text-align: center;
  box-shadow: rgba(0, 0, 0, 0.117647) 0px 1px 6px, rgba(0, 0, 0, 0.117647) 0px 1px 4px;

  @media screen and (max-width: 768px) {
    display: none;
  }
`;

const StyledLogo = styled(Logo)`
  width: ${props => props.theme.logoSize || 85}%;
  margin-top: 10px;
`;

const StyledTitle = styled.div`
  text-align: center;
  margin-top: 25px;
  padding: 0 10px;
`

const StyledFlightboxLabel = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${props => props.theme.colors.main};
  margin-bottom: 4px;
`

const StyledAerodromeName = styled.div`
  font-size: 0.75rem;
  color: #666;
  line-height: 1.2;
  word-break: break-word;
`

class Header extends React.PureComponent {

  render() {
    return (
      <Wrapper>
        <Link to="/">
          <StyledLogo/>
        </Link>
        <StyledTitle>
          <StyledFlightboxLabel>Flightbox</StyledFlightboxLabel>
          <StyledAerodromeName>{__CONF__.aerodrome.name}</StyledAerodromeName>
        </StyledTitle>
      </Wrapper>
    );
  }
}

export default Header;
