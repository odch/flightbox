import React, { PropTypes, Component } from 'react';
import WizardStep from '../../WizardStep';
import LabeledComponent from '../../LabeledComponent';

class DepartureArrivalData extends WizardStep {

  render() {
    return (
      <fieldset>
        <legend>Start und Ziel</legend>
        <LabeledComponent label="Datum" className="date" component={<input type="date" value={this.state.data.date} onChange={this.getUpdateHandlerDelegate('date', this)}/>}/>
        <LabeledComponent label="Startzeit (Lokalzeit)" className="start-time" component={<input type="time" value={this.state.data.startTime} onChange={this.getUpdateHandlerDelegate('startTime', this)}/>}/>
        <LabeledComponent label="Zielflugplatz" className="destination" component={<input type="text" value={this.state.data.destination} onChange={this.getUpdateHandlerDelegate('destination', this)}/>}/>
        <LabeledComponent label="Flugdauer" className="duration" component={<input type="time" value={this.state.data.duration} onChange={this.getUpdateHandlerDelegate('duration', this)}/>}/>
      </fieldset>
    );
  }
}

export default DepartureArrivalData;
