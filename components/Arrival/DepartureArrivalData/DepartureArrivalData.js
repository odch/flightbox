import React, { PropTypes, Component } from 'react';
import WizardStep from '../../WizardStep';
import LabeledComponent from '../../LabeledComponent';
import RadioGroup from '../../RadioGroup';
import IncrementationField from '../../IncrementationField';

class DepartureArrivalData extends WizardStep {

  constructor(props) {
    super(props);
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
      <fieldset className="DepartureArrival">
        <legend>Start und Ziel</legend>
        <LabeledComponent label="Startflugplatz" className="departure" component={<input type="text" value={this.state.data.departure} onChange={this.getUpdateHandlerDelegate('departure', this)}/>}/>
        <LabeledComponent label="Landezeit (Lokalzeit)" className="arrival-time" component={<input type="time" value={this.state.data.arrivalTime} onChange={this.getUpdateHandlerDelegate('arrivalTime', this)}/>}/>
        <div className="clear"/>
        <LabeledComponent label="Pistenrichtung" className="runway" component={<RadioGroup name="runway" items={this.runway} value={this.state.data.runway} onChange={this.getUpdateHandlerDelegate('runway', this)}/>}/>
        <LabeledComponent label="Anzahl Landungen" className="landing-count" component={<IncrementationField value={this.state.data.landingCount} onChange={this.getUpdateHandlerDelegate('landingCount', this)}/>}/>
      </fieldset>
    );
  }
}

export default DepartureArrivalData;
