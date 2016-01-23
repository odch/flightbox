import React from 'react';
import WizardStep from '../../WizardStep';
import LabeledComponent from '../../LabeledComponent';
import IncrementationField from '../../IncrementationField';

class DepartureArrivalData extends WizardStep {

  render() {
    const locationInput = (
      <input
        name="location"
        type="text"
        value={this.state.data.location}
        onChange={this.getUpdateHandlerDelegate('location', this)}
        onKeyUp={this.getKeyUpHandlerDelegate('location')}
      />
    );
    const dateInput = (
      <input
        name="date"
        type="date"
        value={this.state.data.date}
        onChange={this.getUpdateHandlerDelegate('date', this)}
      />
    );
    const arrivalTimeInput = (
      <input
        name="time"
        type="time"
        value={this.state.data.time}
        onChange={this.getUpdateHandlerDelegate('time', this)}
      />
    );
    const landingCountInput = (
      <IncrementationField
        name="landingCount"
        value={this.state.data.landingCount}
        minValue={1}
        onChange={this.getUpdateHandlerDelegate('landingCount', this)}
      />
    );

    return (
      <fieldset className="DepartureArrival">
        <legend>Start und Ziel</legend>
        <LabeledComponent label="Startflugplatz" className="location" component={locationInput}/>
        <LabeledComponent label="Datum" className="date" component={dateInput}/>
        <LabeledComponent label="Landezeit (Lokalzeit)" className="arrival-time" component={arrivalTimeInput}/>
        <LabeledComponent label="Anzahl Landungen" className="landing-count" component={landingCountInput}/>
      </fieldset>
    );
  }
}

export default DepartureArrivalData;
