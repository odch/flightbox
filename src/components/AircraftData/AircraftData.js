import React, { PropTypes, Component } from 'react';
import WizardStep from '../WizardStep';
import LabeledComponent from '../LabeledComponent';

class AircraftData extends WizardStep {

  render() {
    return (
      <fieldset>
        <legend>Flugzeugdaten</legend>
        <LabeledComponent label="Immatrikulation" className="immatriculation" component={<input type="text" value={this.state.data.immatriculation} onChange={this.getUpdateHandlerDelegate('immatriculation', this)}/>}/>
        <LabeledComponent label="Typ" className="type" component={<input type="text" value={this.state.data.aircraftType} onChange={this.getUpdateHandlerDelegate('aircraftType', this)}/>}/>
        <LabeledComponent label="Maximales Abfluggewicht (in Kilogramm)" className="mtow" component={<input type="number" value={this.state.data.mtow} onChange={this.getUpdateHandlerDelegate('mtow', this)}/>}/>
      </fieldset>
    );
  }
}

export default AircraftData;
