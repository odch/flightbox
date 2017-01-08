import React from 'react';
import styled from 'styled-components';
import Logo from '../Logo';

const Wrapper = styled.header`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 17%;
  box-sizing: border-box;
  background-color: ${props => props.theme.colors.background};
  text-align: center;
  
  @media screen and (max-width: 768px) {
    width: 0;
  }
`;

const StyledLogo = styled(Logo)`
  width: 85%;
  margin-top: 10px;
`;

const Header = () => (
  <Wrapper>
    <a href="#/">
      <StyledLogo/>
    </a>
  </Wrapper>
);

export default Header;