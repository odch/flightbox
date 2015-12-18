import React, { PropTypes, Component } from 'react';
import WizardStep from '../../WizardStep';
import RadioGroup from '../../RadioGroup';
import LabeledComponent from '../../LabeledComponent';

class FlightData extends WizardStep {

  constructor(props) {
    super(props);
    this.types = [
      {
        label: 'Privat',
        value: 'private'
      }, {
        label: 'Gewerblich',
        value: 'commercial'
      }, {
        label: 'Schulung',
        value: 'instruction'
      }
    ];
    this.arrivalRoutes = [
      {
        label: 'Sektor Nord',
        value: 'north'
      }, {
        label: 'Sektor Süd',
        value: 'south'
      }
    ];
    this.runway = [
      {
        label: '06',
        value: '06'
      }, {
        label: '24',
        value: '24'
      }
    ];
  }

  render() {
    return (
      <fieldset className="FlightData">
        <legend>Flug</legend>
        <LabeledComponent label="Typ" className="type" component={<RadioGroup name="type" items={this.types} value={this.state.data.type} onChange={this.getUpdateHandlerDelegate('type', this)}/>}/>
        <LabeledComponent label="Ankunftsroute" className="arrival-route" component={<RadioGroup name="arrival-route" items={this.arrivalRoutes} value={this.state.data.arrivalRoute} onChange={this.getUpdateHandlerDelegate('arrivalRoute', this)}/>}/>
        <div className="clear"/>
        <LabeledComponent label="Bemerkungen" className="remarks" component={<textarea value={this.state.data.remarks} onChange={this.getUpdateHandlerDelegate('remarks', this)}/>}/>
        <LabeledComponent label="Pistenrichtung" className="runway" component={<RadioGroup name="runway" items={this.runway} value={this.state.data.runway} onChange={this.getUpdateHandlerDelegate('runway', this)}/>}/>
      </fieldset>
    );
  }
}

export default FlightData;
