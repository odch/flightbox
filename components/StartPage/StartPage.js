import React, { PropTypes, Component } from 'react';
import './StartPage.scss';
import StartButton from '../StartButton';

class StartPage extends Component {

  render() {
    const departureImagePath = require('./ic_flight_takeoff_black_48dp_2x.png');
    const arrivalImagePath = require('./ic_flight_land_black_48dp_2x.png');
    return (
      <div className="StartPage">
        <header>
          <img className="logo" src="mfgt_logo_transp.png"/>
        </header>
        <div className="wrapper">
          <StartButton className="departure" img={departureImagePath} label="Abflug"/>
          <StartButton className="arrival" img={arrivalImagePath} label="Ankunft"/>
        </div>
      </div>
    );
  }
}

export default StartPage;
