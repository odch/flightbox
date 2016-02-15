import React from 'react';
import WizardStep from '../../WizardStep';
import RadioGroup from '../../RadioGroup';
import LabeledComponent from '../../LabeledComponent';

class FlightData extends WizardStep {

  constructor(props) {
    super(props);
    this.types = [
      {
        label: 'Privat',
        value: 'private',
      }, {
        label: 'Gewerblich',
        value: 'commercial',
      }, {
        label: 'Schulung',
        value: 'instruction',
      },
    ];
    this.arrivalRoutes = [
      {
        label: 'Sektor Nord',
        value: 'north',
      }, {
        label: 'Sektor Süd',
        value: 'south',
      },
    ];
    this.runway = [
      {
        label: '06',
        value: '06',
      }, {
        label: '24',
        value: '24',
      },
    ];
  }

  render() {
    return (
      <fieldset className="FlightData">
        <legend>Flug</legend>
        <LabeledComponent
          label="Typ"
          className="type"
          component={<RadioGroup name="type" items={this.types} value={this.state.data.flightType} onChange={this.getUpdateHandlerDelegate('flightType', this)}/>}
          validationError={this.getValidationError('flightType')}
        />
        <LabeledComponent
          label="Ankunftsroute"
          className="arrival-route"
          component={<RadioGroup name="arrival-route" items={this.arrivalRoutes} value={this.state.data.arrivalRoute} onChange={this.getUpdateHandlerDelegate('arrivalRoute', this)}/>}
          validationError={this.getValidationError('arrivalRoute')}
        />
        <LabeledComponent
          label="Bemerkungen"
          className="remarks"
          component={<textarea value={this.state.data.remarks} onChange={this.getUpdateHandlerDelegate('remarks', this)}/>}
          validationError={this.getValidationError('remarks')}
        />
        <LabeledComponent
          label="Pistenrichtung"
          className="runway"
          component={<RadioGroup name="runway" items={this.runway} value={this.state.data.runway} onChange={this.getUpdateHandlerDelegate('runway', this)}/>}
          validationError={this.getValidationError('runway')}
        />
      </fieldset>
    );
  }

  getValidationConfig() {
    return {
      flightType: {
        types: {
          required: true,
          values: ['private', 'commercial', 'instruction'],
        },
        message: 'Wählen Sie hier den Typ des Fluges aus.',
      },
      arrivalRoute: {
        types: {
          required: true,
          values: ['north', 'south'],
        },
        message: 'Wählen Sie hier die Ankunftsroute aus.',
      },
      runway: {
        types: {
          required: true,
          values: ['06', '24'],
        },
        message: 'Wählen Sie hier die Pistenrichtung für die Landung aus.',
      },
    };
  }
}

export default FlightData;
