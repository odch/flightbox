import React from 'react';
import styled from 'styled-components';
import {Link} from 'react-router-dom';
import Logo from '../Logo';

const Wrapper = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 17%;
  box-sizing: border-box;
  background-color: ${props => props.theme.colors.background};
  text-align: center;
  
  @media screen and (max-width: 768px) {
    display: none;
  }
`;

const StyledLogo = styled(Logo)`
  width: 85%;
  margin-top: 10px;
`;

class Header extends React.PureComponent {

  render() {
    return (
      <Wrapper>
        <Link to="/">
          <StyledLogo/>
        </Link>
      </Wrapper>
    );
  }
}

export default Header;
