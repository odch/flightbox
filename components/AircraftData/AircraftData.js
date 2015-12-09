import React, { PropTypes, Component } from 'react';
import WizardStep from '../WizardStep';
import LabeledComponent from '../LabeledComponent';

class AircraftData extends WizardStep {

  render() {
    return (
      <fieldset>
        <legend>Flugzeugdaten</legend>
        <LabeledComponent label="Immatrikulation" className="immatriculation" component={<input type="text"/>}/>
        <LabeledComponent label="Typ" className="type" component={<input type="text"/>}/>
        <LabeledComponent label="Maximales Abfluggewicht (in Kilogramm)" className="mtow" component={<input type="number"/>}/>
      </fieldset>
    );
  }
}

export default AircraftData;
