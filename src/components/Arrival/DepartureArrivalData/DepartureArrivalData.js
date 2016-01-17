import React, { PropTypes, Component } from 'react';
import WizardStep from '../../WizardStep';
import LabeledComponent from '../../LabeledComponent';
import RadioGroup from '../../RadioGroup';
import IncrementationField from '../../IncrementationField';

class DepartureArrivalData extends WizardStep {

  render() {
    return (
      <fieldset className="DepartureArrival">
        <legend>Start und Ziel</legend>
        <LabeledComponent label="Startflugplatz" className="location" component={<input type="text" value={this.state.data.location} onChange={this.getUpdateHandlerDelegate('location', this)}/>}/>
        <LabeledComponent label="Datum" className="date" component={<input type="date" value={this.state.data.date} onChange={this.getUpdateHandlerDelegate('date', this)}/>}/>
        <LabeledComponent label="Landezeit (Lokalzeit)" className="arrival-time" component={<input type="time" value={this.state.data.time} onChange={this.getUpdateHandlerDelegate('time', this)}/>}/>
        <LabeledComponent label="Anzahl Landungen" className="landing-count" component={<IncrementationField value={this.state.data.landingCount} minValue={1} onChange={this.getUpdateHandlerDelegate('landingCount', this)}/>}/>
      </fieldset>
    );
  }
}

export default DepartureArrivalData;
