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
        readOnly={this.props.readOnly}
      />
    );
    const typeInput = (
      <input
        name="aircraftType"
        type="text"
        value={this.state.data.aircraftType}
        onChange={this.getUpdateHandlerDelegate('aircraftType', this)}
        onKeyUp={this.getKeyUpHandlerDelegate('aircraftType')}
        readOnly={this.props.readOnly}
      />
    );
    const mtowInput = (
      <input
        name="mtow"
        type="number"
        value={this.state.data.mtow}
        onChange={this.updateMtowHandler.bind(this)}
        readOnly={this.props.readOnly}
      />
    );

    return (
      <fieldset>
        <legend>Flugzeugdaten</legend>
        <LabeledComponent
          label="Immatrikulation"
          className="immatriculation"
          component={immatriculationInput}
          validationError={this.getValidationError('immatriculation')}
        />
        <LabeledComponent
          label="Typ"
          className="type"
          component={typeInput}
          validationError={this.getValidationError('aircraftType')}
        />
        <LabeledComponent
          label="Maximales Abfluggewicht (in Kilogramm)"
          className="mtow"
          component={mtowInput}
          validationError={this.getValidationError('mtow')}
        />
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

  getValidationConfig() {
    return {
      immatriculation: {
        types: {
          required: true,
          match: /^[A-Z0-9]+$/,
        },
        message: 'Geben Sie hier die Immatrikulation des Flugzeugs ein. ' +
        'Sie darf nur Grossbuchstaben und Zahlen enthalten.',
      },
      aircraftType: {
        types: {
          required: true,
        },
        message: 'Geben Sie hier den Typ des Flugzeugs ein.',
      },
      mtow: {
        types: {
          required: true,
          integer: true,
        },
        message: 'Geben Sie hier das maximale Abfluggewicht des Flugzeugs ein (in Kilogramm).',
      },
    };
  }
}

export default AircraftData;
