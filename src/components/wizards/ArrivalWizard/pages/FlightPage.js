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

const arrivalRoutes = [
  {
    label: 'Sektor Nord',
    value: 'north',
    available: arg => !arg.oppositeData || arg.oppositeData.departureRoute !== 'circuits',
  },
  {
    label: 'Sektor Süd',
    value: 'south',
    available: arg => !arg.oppositeData || arg.oppositeData.departureRoute !== 'circuits',
  }, {
    label: 'Platzrunden',
    value: 'circuits',
    description: 'Ohne Verlassen des Platzverkehrs',
    available: arg => arg.data.location.toUpperCase() === 'LSZT' &&
                      (!arg.oppositeData || arg.oppositeData.departureRoute === 'circuits'),
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
          name="arrivalRoute"
          component={renderSingleSelect}
          items={arrivalRoutes}
          orientation="vertical"
          parse={e => e.target.value}
          label="Ankunftsroute"
        />
        <Field
          name="remarks"
          component={renderTextArea}
          label="Bemerkungen"
        />
        <Field
          name="runway"
          component={renderSingleSelect}
          items={runways}
          parse={e => e.target.value}
          label="Pistenrichtung"
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
  previousPage: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
};

export default reduxForm({
  form: 'wizard',
  destroyOnUnmount: false,
  validate,
})(FlightPage);
