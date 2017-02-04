import React, { PropTypes, Component } from 'react';
import styled from 'styled-components';
import Item from './Item';

const Wrapper = styled.div`
  font-size: 1.2em;
  margin-bottom: 2em;
  
  @media (max-width: 768px) {
    text-align: center;
  }
`;

const JumpNavigation = () => (
  <Wrapper>
    <Item href="/" icon="home" label="Startseite"/>
    <Item href="/departure/new" icon="flight_takeoff" label="Abflug erfassen"/>
    <Item href="/arrival/new" icon="flight_land" label="Ankunft erfassen"/>
  </Wrapper>
);

export default JumpNavigation;
