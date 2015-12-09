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
        <LabeledComponent label="Typ" className="type" component={<RadioGroup name="type" items={this.types}/>}/>
        <LabeledComponent label="Abflugroute" className="departure-route" component={<RadioGroup name="departure-route" items={this.departureRoutes}/>}/>
        <div className="clear"/>
        <LabeledComponent label="Bemerkungen" className="remarks" component={<textarea/>}/>
        <LabeledComponent label="Routing" className="route" component={<textarea/>}/>
      </fieldset>
    );
  }
}

export default FlightData;
