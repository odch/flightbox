import React from 'react';
import WizardStep from '../WizardStep';
import LabeledComponent from '../LabeledComponent';

class AircraftData extends WizardStep {

  render() {
    const immatriculationInput = (
      <input
        name="immatriculation"
        type="text"
        value={this.state.data.immatriculation}
        onChange={this.getUpdateHandlerDelegate('immatriculation')}
        onKeyUp={this.getKeyUpHandlerDelegate('immatriculation')}
      />
    );
    const typeInput = (
      <input
        name="aircraftType"
        type="text"
        value={this.state.data.aircraftType}
        onChange={this.getUpdateHandlerDelegate('aircraftType', this)}
        onKeyUp={this.getKeyUpHandlerDelegate('aircraftType')}
      />
    );
    const mtowInput = (
      <input
        name="mtow"
        type="number"
        value={this.state.data.mtow}
        onChange={this.updateMtowHandler.bind(this)}
      />
    );

    return (
      <fieldset>
        <legend>Flugzeugdaten</legend>
        <LabeledComponent label="Immatrikulation" className="immatriculation" component={immatriculationInput}/>
        <LabeledComponent label="Typ" className="type" component={typeInput}/>
        <LabeledComponent label="Maximales Abfluggewicht (in Kilogramm)" className="mtow" component={mtowInput}/>
      </fieldset>
    );
  }

  updateMtowHandler(e) {
    if (e.target.value && /^\d+$/.test(e.target.value)) {
      const mtowNumber = parseInt(e.target.value);
      this.updateData('mtow', mtowNumber);
    } else {
      this.updateData('mtow', null);
    }
  }
}

export default AircraftData;
