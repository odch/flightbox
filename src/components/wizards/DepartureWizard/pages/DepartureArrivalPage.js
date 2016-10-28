import React, { PropTypes } from 'react';
import { Field, reduxForm } from 'redux-form';
import validate from '../../validate';
import { renderAerodromeDropdown, renderDateField, renderTimeField, renderDurationField } from '../../renderField';

const DepartureArrivalPage = (props) => {
  const { previousPage, handleSubmit } = props;
  return (
    <form onSubmit={handleSubmit} className="DepartureArrivalPage">
      <fieldset>
        <legend>Start und Ziel</legend>
        <Field
          name="date"
          component={renderDateField}
          parse={e => e.value}
          label="Datum"
        />
        <Field
          name="time"
          component={renderTimeField}
          parse={e => e.value}
          label="Startzeit (Lokalzeit)"
        />
        <Field
          name="location"
          component={renderAerodromeDropdown}
          normalize={aerodrome => aerodrome ? aerodrome.key : null}
          label="Zielflugplatz"
        />
        <Field
          name="duration"
          component={renderDurationField}
          parse={e => e.value}
          label="Flugdauer"
        />
      </fieldset>
      <div className="WizardNavigation">
        <button type="button" className="previous" onClick={previousPage}>Zurück</button>
        <button type="submit" className="next">Weiter</button>
      </div>
    </form>
  );
};

DepartureArrivalPage.propTypes = {
  previousPage: PropTypes.func,
  handleSubmit: PropTypes.func,
};

export default reduxForm({
  form: 'wizard',
  destroyOnUnmount: false,
  validate,
})(DepartureArrivalPage);
