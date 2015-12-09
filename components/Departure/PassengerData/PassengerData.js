import React, { PropTypes, Component } from 'react';
import './PassengerData.scss';
import WizardStep from '../../WizardStep';
import RadioGroup from '../../RadioGroup';
import LabeledComponent from '../../LabeledComponent';
import IncrementationField from '../../IncrementationField';

class PassengerData extends WizardStep {

  carriageVoucher = [
    {
      label: 'Ja',
      value: 'yes',
    }, {
      label: 'Nein',
      value: 'no',
    },
  ];

  render() {
    return (
      <fieldset className="PassengerData">
        <legend>Passagiere</legend>
        <LabeledComponent label="Anzahl" className="count" component={<IncrementationField/>}/>
        <LabeledComponent label="Beförderungsschein" className="carriage-voucher" component={<RadioGroup name="carriage-voucher" items={this.carriageVoucher}/>}/>
      </fieldset>
    );
  }
}

export default PassengerData;
