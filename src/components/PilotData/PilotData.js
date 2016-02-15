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
        <LabeledComponent
          label="MFGT-Mitgliedernummer"
          className="memberNr"
          component={memberNrInput}
          validationError={this.getValidationError('memberNr')}
        />
        <LabeledComponent
          label="Telefon"
          className="phone"
          component={phoneInput}
          validationError={this.getValidationError('phone')}
        />
        <LabeledComponent
          label="Nachname"
          className="lastname"
          component={lastnameInput}
          validationError={this.getValidationError('lastname')}
        />
        <LabeledComponent
          label="Vorname"
          className="firstname"
          component={firstnameInput}
          validationError={this.getValidationError('firstname')}
        />
      </fieldset>
    );
  }

  getValidationConfig() {
    return {
      lastname: {
        types: {
          required: true,
        },
        message: 'Geben Sie hier den Nachnamen des Piloten ein.',
      },
      firstname: {
        types: {
          required: true,
        },
        message: 'Geben Sie hier den Vornamen des Piloten ein.',
      },
    };
  }
}

export default PilotData;
