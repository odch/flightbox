import PropTypes from 'prop-types';
import React from 'react';
import {Field, Form} from 'react-final-form';
import validate from '../../validate';
import {renderIncrementationField} from '../../renderField';
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
  const { previousPage, formValues, hiddenFields, readOnly, onSubmit, cancel } = props;
  return (
    <Form
      initialValues={formValues}
      validate={validate('arrival', ['passengerCount'], hiddenFields)}
      onSubmit={onSubmit}
    >
      {({handleSubmit, form}) => (
        <form onSubmit={handleSubmit} className="PassengerPage">
          <FieldSet>
            <Field
              name="passengerCount"
              format={toNumber}
              label="Anzahl Passagiere"
              component={renderIncrementationField}
              readOnly={readOnly}
            />
          </FieldSet>
          <WizardNavigation previousStep={() => previousPage(form.getState().values)} cancel={cancel}/>
        </form>
      )}
    </Form>
  );
};

PassengerPage.propTypes = {
  previousPage: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  formValues: PropTypes.object.isRequired,
};

export default PassengerPage;
