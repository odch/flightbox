import React from 'react';
import WizardStep from '../../WizardStep';
import LabeledComponent from '../../LabeledComponent';

class DepartureArrivalData extends WizardStep {

  render() {
    const dateInput = (
      <input
        name="date"
        type="date"
        value={this.state.data.date}
        onChange={this.getUpdateHandlerDelegate('date', this)}
      />
    );
    const timeInput = (
      <input
        name="time"
        type="time"
        value={this.state.data.time}
        onChange={this.getUpdateHandlerDelegate('time', this)}
      />
    );
    const locationInput = (
      <input
        name="location"
        type="text"
        value={this.state.data.location}
        onChange={this.getUpdateHandlerDelegate('location', this)}
        onKeyUp={this.getKeyUpHandlerDelegate('location')}
      />
    );
    const durationInput = (
      <input
        name="duration"
        type="time"
        value={this.state.data.duration}
        onChange={this.getUpdateHandlerDelegate('duration', this)}
      />
    );

    return (
      <fieldset>
        <legend>Start und Ziel</legend>
        <LabeledComponent label="Datum" className="date" component={dateInput}/>
        <LabeledComponent label="Startzeit (Lokalzeit)" className="start-time" component={timeInput}/>
        <LabeledComponent label="Zielflugplatz" className="location" component={locationInput}/>
        <LabeledComponent label="Flugdauer" className="duration" component={durationInput}/>
      </fieldset>
    );
  }
}

export default DepartureArrivalData;
