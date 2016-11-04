import React, { PropTypes } from 'react';
import { Field, reduxForm } from 'redux-form';
import validate from '../../validate';
import { renderSingleSelect, renderTextArea } from '../../renderField';

const flightTypes = [
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

const runways = [
  {
    label: '06',
    value: '06',
  }, {
    label: '24',
    value: '24',
  },
];

const departureRoutes = [
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

const FlightPage = (props) => {
  const { previousPage, handleSubmit } = props;
  return (
    <form onSubmit={handleSubmit} className="FlightPage">
      <fieldset>
        <legend>Flug</legend>
        <Field
          name="flightType"
          component={renderSingleSelect}
          items={flightTypes}
          orientation="vertical"
          parse={e => e.target.value}
          label="Typ"
        />
        <Field
          name="runway"
          component={renderSingleSelect}
          items={runways}
          parse={e => e.target.value}
          label="Pistenrichtung"
        />
        <Field
          name="departureRoute"
          component={renderSingleSelect}
          items={departureRoutes}
          orientation="vertical"
          parse={e => e.target.value}
          label="Abflugroute"
        />
        <Field
          name="route"
          component={renderTextArea}
          label="Routing"
        />
        <Field
          name="remarks"
          component={renderTextArea}
          label="Bemerkungen"
        />
      </fieldset>
      <div className="WizardNavigation">
        <button type="button" className="previous" onClick={previousPage}>Zurück</button>
        <button type="submit" className="next">Speichern</button>
      </div>
    </form>
  );
};

FlightPage.propTypes = {
  previousPage: PropTypes.func,
  handleSubmit: PropTypes.func,
};

export default reduxForm({
  form: 'wizard',
  destroyOnUnmount: false,
  validate: validate(['flightType', 'runway', 'departureRoute', 'route', 'remarks']),
})(FlightPage);
