import React, { PropTypes, Component } from 'react';
import WizardStep from '../../WizardStep';
import RadioGroup from '../../RadioGroup';
import './FlightData.scss';
import LabeledComponent from '../../LabeledComponent';

class FlightData extends WizardStep {

  types = [
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

  departureRoutes = [
    {
      label: 'Sektor Süd',
      value: 'south',
    }, {
      label: 'Matzingen',
      value: 'matzingen',
    },
  ];

  render() {
    return (
      <fieldset className="FlightData">
        <legend>Flug</legend>
        <LabeledComponent label="Typ" className="type" component={<RadioGroup name="type" items={this.types} value={this.state.data.type} onChange={this.getUpdateHandlerDelegate('type', this)}/>}/>
        <LabeledComponent label="Abflugroute" className="departure-route" component={<RadioGroup name="departure-route" items={this.departureRoutes} value={this.state.data.departureRoute} onChange={this.getUpdateHandlerDelegate('departureRoute', this)}/>}/>
        <div className="clear"/>
        <LabeledComponent label="Bemerkungen" className="remarks" component={<textarea value={this.state.data.remarks} onChange={this.getUpdateHandlerDelegate('remarks', this)}/>}/>
        <LabeledComponent label="Routing" className="route" component={<textarea value={this.state.data.route} onChange={this.getUpdateHandlerDelegate('route', this)}/>}/>
      </fieldset>
    );
  }
}

export default FlightData;
