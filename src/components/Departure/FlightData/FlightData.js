import React from 'react';
import WizardStep from '../../WizardStep';
import SingleSelect from '../../SingleSelect';
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
        label: 'Platzrunden',
        value: 'circuits',
        description: 'Ohne Verlassen des Platzverkehrs',
        available: arg => arg.data.location.toUpperCase() === 'LSZT',
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
    const typeComponent = (
      <SingleSelect
        items={this.types}
        value={this.state.data.flightType}
        onChange={this.getUpdateHandlerDelegate('flightType', this)}
        orientation="vertical"
        readOnly={this.props.readOnly}
      />
    );
    const runwayComponent = (
      <SingleSelect
        items={this.runway}
        value={this.state.data.runway}
        onChange={this.getUpdateHandlerDelegate('runway', this)}
        readOnly={this.props.readOnly}
      />
    );
    const departureRouteComponent = (
      <SingleSelect
        items={this.filterOptions(this.departureRoutes)}
        value={this.state.data.departureRoute}
        onChange={this.getUpdateHandlerDelegate('departureRoute', this)}
        orientation="vertical"
        readOnly={this.props.readOnly}
      />
    );
    const routingComponent = (
      <textarea
        value={this.state.data.route}
        onChange={this.getUpdateHandlerDelegate('route', this)}
        readOnly={this.props.readOnly}
      />
    );
    const remarksComponent = (
      <textarea
        value={this.state.data.remarks}
        onChange={this.getUpdateHandlerDelegate('remarks', this)}
        readOnly={this.props.readOnly}
      />
    );

    return (
      <fieldset className="FlightData">
        <legend>Flug</legend>
        <LabeledComponent
          label="Typ"
          className="type"
          component={typeComponent}
          validationError={this.getValidationError('flightType')}
        />
        <LabeledComponent
          label="Pistenrichtung"
          className="runway"
          component={runwayComponent}
          validationError={this.getValidationError('runway')}
        />
        <LabeledComponent
          label="Abflugroute"
          className="departure-route"
          component={departureRouteComponent}
          validationError={this.getValidationError('departureRoute')}
        />
        {this.state.data.departureRoute !== 'circuits' ?
          <LabeledComponent
            label="Routing"
            className="route"
            component={routingComponent}
            validationError={this.getValidationError('route')}
          />
          : null
        }
        <LabeledComponent
          label="Bemerkungen"
          className="remarks"
          component={remarksComponent}
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
