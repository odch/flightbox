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
          readOnly={props.readOnly}
        />
        <Field
          name="time"
          component={renderTimeField}
          parse={e => e.value}
          label="Startzeit (Lokalzeit)"
          readOnly={props.readOnly}
        />
        <Field
          name="location"
          component={renderAerodromeDropdown}
          normalize={aerodrome => aerodrome ? aerodrome.key : null}
          label="Zielflugplatz"
          readOnly={props.readOnly}
        />
        <Field
          name="duration"
          component={renderDurationField}
          parse={e => e.value}
          label="Flugdauer"
          readOnly={props.readOnly}
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
  readOnly: PropTypes.bool,
};

export default reduxForm({
  form: 'wizard',
  destroyOnUnmount: false,
  validate: validate('departure', ['date', 'time', 'location', 'duration']),
})(DepartureArrivalPage);
