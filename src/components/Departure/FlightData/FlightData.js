import React, { PropTypes, Component } from 'react';
import WizardStep from '../../WizardStep';
import RadioGroup from '../../RadioGroup';
import './FlightData.scss';
import LabeledComponent from '../../LabeledComponent';

class FlightData extends WizardStep {

  constructor(props) {
    super(props);
    this.types = [
      {
        label: 'Privat',
        value: 'private',
      }, {
        label: 'Gewerblich',
        value: 'commercial',
      }, {
        label: 'Schulung',
        value: 'instruction',
      },
    ];
    this.departureRoutes = [
      {
        label: 'Sektor Süd',
        value: 'south',
      }, {
        label: 'Matzingen',
        value: 'matzingen',
      },
    ];
  }
  render() {
    return (
      <fieldset className="FlightData">
        <legend>Flug</legend>
        <LabeledComponent label="Typ" className="type" component={<RadioGroup name="type" items={this.types} value={this.state.data.flightType} onChange={this.getUpdateHandlerDelegate('flightType', this)}/>}/>
        <LabeledComponent label="Abflugroute" className="departure-route" component={<RadioGroup name="departure-route" items={this.departureRoutes} value={this.state.data.departureRoute} onChange={this.getUpdateHandlerDelegate('departureRoute', this)}/>}/>
        <LabeledComponent label="Bemerkungen" className="remarks" component={<textarea value={this.state.data.remarks} onChange={this.getUpdateHandlerDelegate('remarks', this)}/>}/>
        <LabeledComponent label="Routing" className="route" component={<textarea value={this.state.data.route} onChange={this.getUpdateHandlerDelegate('route', this)}/>}/>
      </fieldset>
    );
  }
}

export default FlightData;
