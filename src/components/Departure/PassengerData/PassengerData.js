import React, { PropTypes, Component } from 'react';
import './PassengerData.scss';
import WizardStep from '../../WizardStep';
import SingleSelect from '../../SingleSelect';
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
    const countComponent = (
      <IncrementationField
        value={this.state.data.passengerCount}
        onChange={this.getUpdateHandlerDelegate('passengerCount', this)}
        readOnly={this.props.readOnly}
      />
    );
    const voucherComponent = (
      <SingleSelect
        items={this.carriageVoucher}
        value={this.state.data.carriageVoucher}
        onChange={this.getUpdateHandlerDelegate('carriageVoucher', this)}
        readOnly={this.props.readOnly}
      />
    );

    return (
      <fieldset className="PassengerData">
        <legend>Passagiere</legend>
        <LabeledComponent label="Anzahl" className="count" component={countComponent}/>
        <LabeledComponent label="Beförderungsschein" className="carriage-voucher" component={voucherComponent}/>
      </fieldset>
    );
  }
}

export default PassengerData;
