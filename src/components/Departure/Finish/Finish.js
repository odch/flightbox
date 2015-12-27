import React, { PropTypes, Component } from 'react';
import './Finish.scss';
import WizardStep from '../../WizardStep';
import ImageButton from '../../ImageButton';

class Finish extends WizardStep {

  render() {
    const exitImagePath = require('./ic_exit_to_app_black_48dp_2x.png');
    return (
      <div className="Finish">
        <div className="msg">Ihr Abflug wurde erfolgreich erfasst!</div>
        <ImageButton label="Beenden" img={exitImagePath} href="/"/>
      </div>
    );
  }

  finish() {
    this.props.finish();
  }
}

Finish.propTypes = {
  finish: PropTypes.func,
};

export default Finish;
