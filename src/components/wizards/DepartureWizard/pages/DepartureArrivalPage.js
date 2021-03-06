import PropTypes from 'prop-types';
import React from 'react';
import { Field, reduxForm } from 'redux-form';
import validate from '../../validate';
import { renderAerodromeDropdown, renderDateField, renderTimeField, renderDurationField } from '../../renderField';
import FieldSet from '../../FieldSet';
import WizardNavigation from '../../../WizardNavigation';

const DepartureArrivalPage = (props) => {
  const { previousPage, handleSubmit } = props;
  return (
    <form onSubmit={handleSubmit} className="DepartureArrivalPage">
      <FieldSet>
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
      </FieldSet>
      <WizardNavigation previousStep={previousPage} cancel={props.cancel}/>
    </form>
  );
};

DepartureArrivalPage.propTypes = {
  previousPage: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
};

export default reduxForm({
  form: 'wizard',
  destroyOnUnmount: false,
  validate: validate('departure', ['date', 'time', 'location', 'duration']),
})(DepartureArrivalPage);
