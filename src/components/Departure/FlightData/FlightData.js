import React from 'react';
import WizardStep from '../../WizardStep';
import RadioGroup from '../../RadioGroup';
import './FlightData.scss';
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
    this.departureRoutes = [
      {
        label: 'Sektor Süd',
        value: 'south',
      }, {
        label: 'Matzingen',
        value: 'matzingen',
      }, {
        label: 'Platzrunden (ohne Verlassen des Platzverkehrs)',
        value: 'circuits',
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
          label="Pistenrichtung"
          className="runway"
          component={<RadioGroup name="runway" items={this.runway} value={this.state.data.runway} onChange={this.getUpdateHandlerDelegate('runway', this)}/>}
          validationError={this.getValidationError('runway')}
        />
        <LabeledComponent
          label="Abflugroute"
          className="departure-route"
          component={<RadioGroup name="departure-route" items={this.departureRoutes} value={this.state.data.departureRoute} onChange={this.getUpdateHandlerDelegate('departureRoute', this)}/>}
          validationError={this.getValidationError('departureRoute')}
        />
        <LabeledComponent
          label="Routing"
          className="route"
          component={<textarea value={this.state.data.route} onChange={this.getUpdateHandlerDelegate('route', this)}/>}
          validationError={this.getValidationError('route')}
        />
        <LabeledComponent
          label="Bemerkungen"
          className="remarks"
          component={<textarea value={this.state.data.remarks} onChange={this.getUpdateHandlerDelegate('remarks', this)}/>}
          validationError={this.getValidationError('remarks')}
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
      runway: {
        types: {
          required: true,
          values: ['06', '24'],
        },
        message: 'Wählen Sie hier die Pistenrichtung für den Abflug aus.',
      },
      departureRoute: {
        types: {
          required: true,
          values: ['south', 'matzingen', 'circuits'],
        },
        message: 'Wählen Sie hier die Abflugroute aus.',
      },
    };
  }
}

export default FlightData;
