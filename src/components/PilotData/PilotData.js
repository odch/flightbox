import React, { PropTypes, Component } from 'react';
import WizardStep from '../WizardStep';
import LabeledComponent from '../LabeledComponent';

class PilotData extends WizardStep {

  render() {
    const memberNrInput = (
      <input
        name="memberNr"
        type="text"
        value={this.state.data.memberNr}
        onChange={this.getUpdateHandlerDelegate('memberNr', this)}
        onKeyUp={this.getKeyUpHandlerDelegate('memberNr')}
      />
    );
    const phoneInput = (
      <input
        name="phone"
        type="text"
        value={this.state.data.phone}
        onChange={this.getUpdateHandlerDelegate('phone', this)}
      />
    );
    const lastnameInput = (
      <input
        name="lastname"
        type="text"
        value={this.state.data.lastname}
        onChange={this.getUpdateHandlerDelegate('lastname', this)}
      />
    );
    const firstnameInput = (
      <input
        name="firstname"
        type="text"
        value={this.state.data.firstname}
        onChange={this.getUpdateHandlerDelegate('firstname', this)}
      />
    );

    return (
      <fieldset>
        <legend>Pilot</legend>
        <LabeledComponent label="MFGT-Mitgliedernummer" className="memberNr" component={memberNrInput}/>
        <LabeledComponent label="Telefon" className="phone" component={phoneInput}/>
        <LabeledComponent label="Nachname" className="lastname" component={lastnameInput}/>
        <LabeledComponent label="Vorname" className="firstname" component={firstnameInput}/>
      </fieldset>
    );
  }
}

export default PilotData;
