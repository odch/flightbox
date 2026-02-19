import PropTypes from 'prop-types';
import React from 'react';
import {Field, Form} from 'react-final-form';
import validate from '../../validate';
import {renderIncrementationField, renderSingleSelect} from '../../renderField';
import FieldSet from '../../FieldSet';
import WizardNavigation from '../../../WizardNavigation';
import {ITEMS} from '../../../../util/carriageVoucher';

const toNumber = value => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.match(/\d+/)) {
    return parseInt(value, 10);
  }
  return undefined;
};

const PassengerPage = (props) => {
  const { readOnly, hiddenFields, formValues, previousPage, onSubmit, cancel } = props;
  return (
    <Form
      initialValues={formValues}
      onSubmit={onSubmit}
      validate={validate('departure', ['passengerCount', 'carriageVoucher'], hiddenFields)}
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
            <Field
              name="carriageVoucher"
              items={ITEMS}
              label="Beförderungsschein"
              component={renderSingleSelect}
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
