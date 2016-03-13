import React from 'react';
import WizardStep from '../../WizardStep';
import LabeledComponent from '../../LabeledComponent';
import IncrementationField from '../../IncrementationField';
import DatePicker from '../../DatePicker';
import TimeField from '../../TimeField';

class DepartureArrivalData extends WizardStep {

  render() {
    const locationInput = (
      <input
        name="location"
        type="text"
        value={this.state.data.location}
        onChange={this.getUpdateHandlerDelegate('location', this)}
        onKeyUp={this.getKeyUpHandlerDelegate('location')}
        readOnly={this.props.readOnly}
      />
    );
    const dateInput = (
      <DatePicker
        value={this.state.data.date}
        onChange={(e) => this.updateData('date', e.value)}
        readOnly={this.props.readOnly}
      />
    );
    const arrivalTimeInput = (
      <TimeField
        value={this.state.data.time}
        onChange={(e) => this.updateData('time', e.value)}
        readOnly={this.props.readOnly}
      />
    );
    const landingCountInput = (
      <IncrementationField
        name="landingCount"
        value={this.state.data.landingCount}
        minValue={1}
        onChange={this.getUpdateHandlerDelegate('landingCount', this)}
        readOnly={this.props.readOnly}
      />
    );

    return (
      <fieldset className="DepartureArrivalData">
        <legend>Start und Ziel</legend>
        <LabeledComponent
          label="Startflugplatz"
          className="location"
          component={locationInput}
          validationError={this.getValidationError('location')}
        />
        <LabeledComponent
          label="Datum"
          className="date"
          component={dateInput}
          validationError={this.getValidationError('date')}
        />
        <LabeledComponent
          label="Landezeit (Lokalzeit)"
          className="arrival-time"
          component={arrivalTimeInput}
          validationError={this.getValidationError('time')}
        />
        <LabeledComponent
          label="Anzahl Landungen"
          className="landing-count"
          component={landingCountInput}
          validationError={this.getValidationError('landingCount')}
        />
      </fieldset>
    );
  }

  getValidationConfig() {
    return {
      location: {
        types: {
          required: true,
        },
        message: 'Geben Sie hier den Startflugplatz ein. Wenn der Flugplatz ein ICAO-Kürzel besitzt,' +
        'verwenden Sie dieses.',
      },
      date: {
        types: {
          required: true,
          match: /^\d{4}-\d{2}-\d{2}$/,
        },
        message: 'Geben Sie hier das Datum ein.',
      },
      time: {
        types: {
          required: true,
          match: /^\d{2}:\d{2}$/,
        },
        message: 'Geben Sie hier die Landezeit in Stunden und Minuten ein (Lokalzeit).',
      },
      landingCount: {
        types: {
          required: true,
          integer: true,
        },
        message: 'Geben Sie hier die Anzahl Landungen ein.',
      },
    };
  }
}

export default DepartureArrivalData;
