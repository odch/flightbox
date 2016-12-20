import React from 'react';
import styled from 'styled-components';
import ImageButton from '../ImageButton';

const Wrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const EntryPoint = styled(ImageButton)`
  width: 33%;
  margin: 1em 0;
  
  @media screen and (max-width: 768px) {
    width: 100%;
    display: inline-block;
    margin-top: 2em;
  }
`;

const EntryPoints = props => {
  const departureImagePath = require('./ic_flight_takeoff_black_48dp_2x.png');
  const arrivalImagePath = require('./ic_flight_land_black_48dp_2x.png');
  const movementsImagePath = require('./ic_list_black_48dp_2x.png');
  const messageImagePath = require('./ic_message_black_48dp_2x.png');
  const helpImagePath = require('./ic_help_outline_black_48dp_2x.png');
  const adminImagePath = require('./ic_settings_black_48dp_2x.png');

  return (
    <Wrapper>
      <EntryPoint img={departureImagePath} label="Abflug" href="#/departure/new"/>
      <EntryPoint img={arrivalImagePath} label="Ankunft" href="#/arrival/new"/>
      <EntryPoint img={movementsImagePath} label="Erfasste Bewegungen" href="#/movements"/>
      <EntryPoint img={messageImagePath} label="Rückmeldung" href="#/message"/>
      <EntryPoint img={helpImagePath} label="Hilfe" href="#/help"/>
      {props.admin === true && <EntryPoint img={adminImagePath} label="Administration" href="#/admin"/>}
    </Wrapper>
  );
};

EntryPoints.propTypes = {
  admin: React.PropTypes.bool,
};

export default EntryPoints;
