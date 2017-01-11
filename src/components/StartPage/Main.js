import React from 'react';
import styled from 'styled-components';
import Hints from './Hints';
import EntryPoints from './EntryPoints';

const Wrapper = styled.div`
  position: absolute;
  top: 25%;
  width: 100%;
`;

const Main = props => (
  <Wrapper className="main">
    <Hints/>
    <EntryPoints admin={props.admin}/>
  </Wrapper>
);

Main.propTypes = {
  admin: React.PropTypes.bool,
};

export default Main;
