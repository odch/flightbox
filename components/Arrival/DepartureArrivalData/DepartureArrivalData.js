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
        <LabeledComponent label="Startflugplatz" className="departure" component={<input type="text" value={this.state.data.departure} onChange={this.getUpdateHandlerDelegate('departure', this)}/>}/>
        <LabeledComponent label="Datum" className="date" component={<input type="date" value={this.state.data.date} onChange={this.getUpdateHandlerDelegate('date', this)}/>}/>
        <div className="clear"/>
        <LabeledComponent label="Landezeit (Lokalzeit)" className="arrival-time" component={<input type="time" value={this.state.data.arrivalTime} onChange={this.getUpdateHandlerDelegate('arrivalTime', this)}/>}/>
        <LabeledComponent label="Anzahl Landungen" className="landing-count" component={<IncrementationField value={this.state.data.landingCount} onChange={this.getUpdateHandlerDelegate('landingCount', this)}/>}/>
      </fieldset>
    );
  }
}

export default DepartureArrivalData;
