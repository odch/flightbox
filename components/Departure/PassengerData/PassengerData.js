import React, { PropTypes, Component } from 'react';
import './PassengerData.scss';
import WizardStep from '../../WizardStep';
import RadioGroup from '../../RadioGroup';
import LabeledComponent from '../../LabeledComponent';
import IncrementationField from '../../IncrementationField';

class PassengerData extends WizardStep {

  constructor(props) {
    super(props);
    this.carriageVoucher = [
      {
        label: 'Ja',
        value: 'yes',
      }, {
        label: 'Nein',
        value: 'no',
      },
    ];
  }

  render() {
    return (
      <fieldset className="PassengerData">
        <legend>Passagiere</legend>
        <LabeledComponent label="Anzahl" className="count" component={<IncrementationField value={this.state.data.count} onChange={this.getUpdateHandlerDelegate('count', this)}/>}/>
        <LabeledComponent label="Beförderungsschein" className="carriage-voucher" component={<RadioGroup name="carriage-voucher" items={this.carriageVoucher} value={this.state.data.carriageVoucher} onChange={this.getUpdateHandlerDelegate('carriageVoucher', this)}/>}/>
      </fieldset>
    );
  }
}

export default PassengerData;
