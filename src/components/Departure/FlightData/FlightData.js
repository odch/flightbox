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
    this.runway = [
      {
        label: '06',
        value: '06',
      }, {
        label: '24',
        value: '24',
      },
    ];
  }
  render() {
    return (
      <fieldset className="FlightData">
        <legend>Flug</legend>
        <LabeledComponent label="Typ" className="type" component={<RadioGroup name="type" items={this.types} value={this.state.data.flightType} onChange={this.getUpdateHandlerDelegate('flightType', this)}/>}/>
        <LabeledComponent label="Pistenrichtung" className="runway" component={<RadioGroup name="runway" items={this.runway} value={this.state.data.runway} onChange={this.getUpdateHandlerDelegate('runway', this)}/>}/>
        <LabeledComponent label="Abflugroute" className="departure-route" component={<RadioGroup name="departure-route" items={this.departureRoutes} value={this.state.data.departureRoute} onChange={this.getUpdateHandlerDelegate('departureRoute', this)}/>}/>
        <LabeledComponent label="Routing" className="route" component={<textarea value={this.state.data.route} onChange={this.getUpdateHandlerDelegate('route', this)}/>}/>
        <LabeledComponent label="Bemerkungen" className="remarks" component={<textarea value={this.state.data.remarks} onChange={this.getUpdateHandlerDelegate('remarks', this)}/>}/>
      </fieldset>
    );
  }
}

export default FlightData;
