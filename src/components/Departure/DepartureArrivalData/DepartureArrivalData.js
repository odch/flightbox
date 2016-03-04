import React from 'react';
import WizardStep from '../../WizardStep';
import LabeledComponent from '../../LabeledComponent';
import DatePicker from '../../DatePicker';
import TimeField from '../../TimeField';

class DepartureArrivalData extends WizardStep {

  render() {
    const dateInput = (
      <DatePicker
        value={this.state.data.date}
        onChange={(e) => this.updateData('date', e.value)}
      />
    );
    const timeInput = (
      <TimeField
        value={this.state.data.time}
        onChange={(e) => this.updateData('time', e.value)}
      />
    );
    const locationInput = (
      <input
        name="location"
        type="text"
        value={this.state.data.location}
        onChange={this.getUpdateHandlerDelegate('location', this)}
        onKeyUp={this.getKeyUpHandlerDelegate('location')}
      />
    );
    const durationInput = (
      <TimeField
        value={this.state.data.duration}
        onChange={(e) => this.updateData('duration', e.value)}
      />
    );

    return (
      <fieldset className="DepartureArrivalData">
        <legend>Start und Ziel</legend>
        <LabeledComponent
          label="Datum"
          className="date"
          component={dateInput}
          validationError={this.getValidationError('date')}
        />
        <LabeledComponent
          label="Startzeit (Lokalzeit)"
          className="start-time"
          component={timeInput}
          validationError={this.getValidationError('time')}
        />
        <LabeledComponent
          label="Zielflugplatz"
          className="location"
          component={locationInput}
          validationError={this.getValidationError('location')}
        />
        <LabeledComponent
          label="Flugdauer"
          className="duration"
          component={durationInput}
          validationError={this.getValidationError('duration')}
        />
      </fieldset>
    );
  }

  getValidationConfig() {
    return {
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
        message: 'Geben Sie hier die Startzeit in Stunden und Minuten ein (Lokalzeit).',
      },
      location: {
        types: {
          required: true,
        },
        message: 'Geben Sie hier den Zielflugplatz ein. Wenn der Flugplatz ein ICAO-Kürzel besitzt,' +
        'verwenden Sie dieses.',
      },
      duration: {
        types: {
          required: true,
          match: /^\d{2}:\d{2}$/,
        },
        message: 'Geben Sie hier die Dauer des Fluges in Stunden und Minuten ein.',
      },
    };
  }
}

export default DepartureArrivalData;
