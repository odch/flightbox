import React, { PropTypes, Component } from 'react';
import './StartPage.scss';
import ImageButton from '../ImageButton';

class StartPage extends Component {

  render() {
    const logoImagePath = require('./mfgt_logo_transp.png');
    const departureImagePath = require('./ic_flight_takeoff_black_48dp_2x.png');
    const arrivalImagePath = require('./ic_flight_land_black_48dp_2x.png');
    const movementsImagePath = require('./ic_list_black_48dp_2x.png');
    return (
      <div className="StartPage">
        <header>
          <img className="logo" src={logoImagePath}/>
        </header>
        <div className="wrapper">
          <ImageButton className="departure" img={departureImagePath} label="Abflug" href="#/departure/new"/>
          <ImageButton className="arrival" img={arrivalImagePath} label="Ankunft" href="#/arrival/new"/>
          <ImageButton className="movements" img={movementsImagePath} label="Erfasste Bewegungen" href="#/movements"/>
        </div>
      </div>
    );
  }
}

export default StartPage;
