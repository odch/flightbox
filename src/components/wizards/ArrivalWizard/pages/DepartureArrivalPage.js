import React, { PropTypes } from 'react';
import { Field, reduxForm } from 'redux-form';
import validate from '../../validate';
import { renderAerodromeDropdown, renderDateField, renderTimeField, renderIncrementationField } from '../../renderField';

const toNumber = value => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.match(/\d+/)) {
    return parseInt(value, 10);
  }
  return undefined;
};

const DepartureArrivalPage = (props) => {
  const { previousPage, handleSubmit } = props;
  return (
    <form onSubmit={handleSubmit} className="DepartureArrivalPage">
      <fieldset>
        <legend>Start und Ziel</legend>
        <Field
          name="location"
          component={renderAerodromeDropdown}
          normalize={aerodrome => aerodrome ? aerodrome.key : null}
          label="Startflugplatz"
          readOnly={props.readOnly}
        />
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
          label="Landezeit (Lokalzeit)"
          readOnly={props.readOnly}
        />
        <Field
          name="landingCount"
          format={toNumber}
          component={renderIncrementationField}
          parse={e => e.target.value}
          label="Anzahl Landungen"
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
  previousPage: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
};

export default reduxForm({
  form: 'wizard',
  destroyOnUnmount: false,
  validate: validate('arrival', ['location', 'date', 'time', 'landingCount']),
})(DepartureArrivalPage);
