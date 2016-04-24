import React, { PropTypes } from 'react';
import './Finish.scss';
import WizardStep from '../../WizardStep';
import ImageButton from '../../ImageButton';
import { getFromItemKey } from '../../../util/reference-number.js';

class Finish extends WizardStep {

  constructor(props) {
    super(props);
    this.state = {
      lsztAircraft: undefined,
      mfgtAircraft: undefined,
    };
  }

  componentWillMount() {
    this.findAircraft('/settings/aircraftsLSZT/', found => {
      this.setState({
        lsztAircraft: found,
      });
    });
    this.findAircraft('/settings/aircraftsMFGT/', found => {
      this.setState({
        mfgtAircraft: found,
      });
    });
  }

  findAircraft(path, callback) {
    this.props.firebaseRootRef.child(path + this.props.data.immatriculation).once('value', snapshot => {
      callback(snapshot.val() === true);
    });
  }

  render() {
    if (this.state.lsztAircraft === undefined || this.state.mfgtAircraft === undefined) {
      return (
        <div className="ArrivalFinish">
          <div className="loading">Bitte warten ...</div>
        </div>
      );
    }

    const heading = this.getHeading();
    const msg = this.getMessage();
    const exitImagePath = require('./ic_exit_to_app_black_48dp_2x.png');
    const departureImagePath = require('./ic_flight_takeoff_black_48dp_2x.png');
    return (
      <div className="ArrivalFinish">
        <div className="heading">{heading}</div>
        {msg ? <div className="msg">{msg}</div> : null}
        <div className="wrapper">
          <ImageButton label="Abflug erfassen" img={departureImagePath} href={'#/departure/new/' + this.props.itemKey}/>
          <ImageButton label="Beenden" img={exitImagePath} href="/"/>
        </div>
      </div>
    );
  }

  getHeading() {
    return (this.props.update === true)
      ? 'Die Ankunft wurde erfolgreich aktualisiert!'
      : 'Ihre Ankunft wurde erfolgreich erfasst!';
  }

  getMessage() {
    if (this.props.update !== true && this.state.mfgtAircraft === false && this.state.lsztAircraft === false) {
      return 'Bitte deponieren Sie die fällige Landetaxe im Briefkasten vor dem C-Büro ' +
        'und kennzeichnen Sie den Umschlag mit der Referenznummer ' + getFromItemKey(this.props.itemKey) + '.';
    }
  }

  finish() {
    this.props.finish();
  }
}

Finish.propTypes = {
  finish: PropTypes.func,
};

export default Finish;
