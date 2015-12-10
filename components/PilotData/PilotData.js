import React, { PropTypes, Component } from 'react';
import WizardStep from '../WizardStep';
import LabeledComponent from '../LabeledComponent';

class PilotData extends WizardStep {

  render() {
    return (
      <fieldset>
        <legend>Pilot</legend>
        <LabeledComponent label="MFGT-Mitgliedernummer" className="memberNr" component={<input type="text" value={this.state.data.memberNr} onChange={this.getUpdateHandlerDelegate('memberNr', this)}/>}/>
        <LabeledComponent label="Telefon" className="phone" component={<input type="text" value={this.state.data.phone} onChange={this.getUpdateHandlerDelegate('phone', this)}/>}/>
        <LabeledComponent label="Nachname" className="lastname" component={<input type="text" value={this.state.data.lastname} onChange={this.getUpdateHandlerDelegate('lastname', this)}/>}/>
        <LabeledComponent label="Vorname" className="firstname" component={<input type="text" value={this.state.data.firstname} onChange={this.getUpdateHandlerDelegate('firstname', this)}/>}/>
      </fieldset>
    );
  }
}

export default PilotData;
