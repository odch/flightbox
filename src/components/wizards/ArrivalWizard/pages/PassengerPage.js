import PropTypes from 'prop-types';
import React from 'react';
import { Field, reduxForm } from 'redux-form';
import validate from '../../validate';
import { renderIncrementationField } from '../../renderField';
import FieldSet from '../../FieldSet';
import WizardNavigation from '../../../WizardNavigation';

const toNumber = value => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.match(/\d+/)) {
    return parseInt(value, 10);
  }
  return undefined;
};

const PassengerPage = props => {
  const { previousPage, handleSubmit } = props;
  return (
    <form onSubmit={handleSubmit} className="PassengerPage">
      <FieldSet>
        <Field
          name="passengerCount"
          format={toNumber}
          parse={e => e.target.value}
          label="Anzahl Passagiere"
          component={renderIncrementationField}
          readOnly={props.readOnly}
        />
      </FieldSet>
      <WizardNavigation previousStep={previousPage} cancel={props.cancel}/>
    </form>
  );
};

PassengerPage.propTypes = {
  previousPage: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
};

export default reduxForm({
  form: 'wizard',
  destroyOnUnmount: false,
  validate: validate('arrival', ['passengerCount']),
})(PassengerPage);
