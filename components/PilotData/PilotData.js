import React, { PropTypes, Component } from 'react';
import WizardStep from '../WizardStep';
import LabeledComponent from '../LabeledComponent';

class PilotData extends WizardStep {

  render() {
    return (
      <fieldset>
        <legend>Pilot</legend>
        <LabeledComponent label="MFGT-Mitgliedernummer" className="member-nr" component={<input type="text"/>}/>
        <LabeledComponent label="Telefon" className="phone" component={<input type="text"/>}/>
        <LabeledComponent label="Nachname" className="lastname" component={<input type="text"/>}/>
        <LabeledComponent label="Vorname" className="firstname" component={<input type="text"/>}/>
      </fieldset>
    );
  }
}

export default PilotData;
