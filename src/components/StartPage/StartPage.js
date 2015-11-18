import React, { PropTypes, Component } from 'react';
import withStyles from '../../decorators/withStyles';
import styles from './StartPage.css';
import StartButton from '../StartButton';

@withStyles(styles)
class StartPage extends Component {

  static contextTypes = {
    onSetTitle: PropTypes.func.isRequired,
    onPageNotFound: PropTypes.func.isRequired,
  };

  render() {
    const title = 'MFGT';
    this.context.onSetTitle(title);
    let departureImagePath = require('./ic_flight_takeoff_black_48dp_2x.png');
    let arrivalImagePath = require('./ic_flight_land_black_48dp_2x.png');
    return (
      <div id="start-page">
        <header>
          <img id="logo" src="mfgt_logo_transp.png"/>
        </header>
        <div id="wrapper">
          <StartButton className="departure" img={departureImagePath} label="Abflug"/>
          <StartButton className="arrival" img={arrivalImagePath} label="Ankunft"/>
        </div>
      </div>
    );
  }
}

export default StartPage;
