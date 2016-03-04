import React, { PropTypes } from 'react';
import './Finish.scss';
import WizardStep from '../../WizardStep';
import ImageButton from '../../ImageButton';

class Finish extends WizardStep {

  render() {
    const msg = this.getMessage();
    const exitImagePath = require('./ic_exit_to_app_black_48dp_2x.png');
    const departureImagePath = require('./ic_flight_takeoff_black_48dp_2x.png');
    return (
      <div className="Finish">
        <div className="msg">{msg}</div>
        <div className="wrapper">
          <ImageButton label="Abflug erfassen" img={departureImagePath} href={'#/departure/new/' + this.props.itemKey}/>
          <ImageButton label="Beenden" img={exitImagePath} href="/"/>
        </div>
      </div>
    );
  }

  getMessage() {
    return (this.props.update === true)
      ? 'Die Ankunft wurde erfolgreich aktualisiert!'
      : 'Ihre Ankunft wurde erfolgreich erfasst!';
  }

  finish() {
    this.props.finish();
  }
}

Finish.propTypes = {
  finish: PropTypes.func,
};

export default Finish;
