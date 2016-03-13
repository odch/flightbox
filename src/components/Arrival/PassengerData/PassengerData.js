import React, { PropTypes, Component } from 'react';
import WizardStep from '../../WizardStep';
import LabeledComponent from '../../LabeledComponent';
import IncrementationField from '../../IncrementationField';

class PassengerData extends WizardStep {

  render() {
    const countComponent = (
      <IncrementationField
        value={this.state.data.passengerCount}
        onChange={this.getUpdateHandlerDelegate('passengerCount', this)}
        readOnly={this.props.readOnly}
      />
    );

    return (
      <fieldset className="PassengerData">
        <legend>Passagiere</legend>
        <LabeledComponent label="Anzahl" className="count" component={countComponent}/>
      </fieldset>
    );
  }
}

export default PassengerData;
