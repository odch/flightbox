import React, { PropTypes, Component } from 'react';
import './StartPage.scss';
import ImageButton from '../ImageButton';

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
          <ImageButton className="departure" img={departureImagePath} label="Abflug" href="departure"/>
          <ImageButton className="arrival" img={arrivalImagePath} label="Ankunft"/>
        </div>
      </div>
    );
  }
}

export default StartPage;
