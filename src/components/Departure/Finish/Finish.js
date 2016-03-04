import React, { PropTypes } from 'react';
import './Finish.scss';
import WizardStep from '../../WizardStep';
import ImageButton from '../../ImageButton';

class Finish extends WizardStep {

  render() {
    const msg = this.getMessage();
    const exitImagePath = require('./ic_exit_to_app_black_48dp_2x.png');
    return (
      <div className="Finish">
        <div className="msg">{msg}</div>
        <ImageButton label="Beenden" img={exitImagePath} href="/"/>
      </div>
    );
  }

  getMessage() {
    return (this.props.itemKey)
      ? 'Der Abflug wurde erfolgreich aktualisiert!'
      : 'Ihr Abflug wurde erfolgreich erfasst!';
  }

  finish() {
    this.props.finish();
  }
}

Finish.propTypes = {
  finish: PropTypes.func,
};

export default Finish;
