import React, { PropTypes, Component } from 'react';
import WizardStep from '../../WizardStep';
import LabeledComponent from '../../LabeledComponent';
import IncrementationField from '../../IncrementationField';

class PassengerData extends WizardStep {

  render() {
    return (
      <fieldset className="PassengerData">
        <legend>Passagiere</legend>
        <LabeledComponent label="Anzahl" className="count" component={<IncrementationField value={this.state.data.passengerCount} onChange={this.getUpdateHandlerDelegate('passengerCount', this)}/>}/>
      </fieldset>
    );
  }
}

export default PassengerData;
