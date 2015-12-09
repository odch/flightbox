import React, { PropTypes, Component } from 'react';
import WizardStep from '../../WizardStep';
import LabeledComponent from '../../LabeledComponent';

class DepartureArrivalData extends WizardStep {

  render() {
    return (
      <fieldset>
        <legend>Start und Ziel</legend>
        <LabeledComponent label="Startdatum" className="start-date" component={<input type="date"/>}/>
        <LabeledComponent label="Startzeit (Lokalzeit)" className="start-time" component={<input type="time"/>}/>
        <LabeledComponent label="Zielflugplatz" className="destination" component={<input type="text"/>}/>
        <LabeledComponent label="Flugdauer" className="duration" component={<input type="time"/>}/>
      </fieldset>
    );
  }
}

export default DepartureArrivalData;
