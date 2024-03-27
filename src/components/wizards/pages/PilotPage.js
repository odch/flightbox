import PropTypes from 'prop-types';
import React from 'react';
import { Field, reduxForm } from 'redux-form';
import validate from '../validate';
import { renderInputField, renderUserDropdown } from '../renderField';
import FieldSet from '../FieldSet';
import WizardNavigation from '../../WizardNavigation';

const PilotPage = (props) => {
  const { previousPage, handleSubmit } = props;
  return (
    <form onSubmit={handleSubmit} className="PilotPage">
      <FieldSet>
        <Field
          name="memberNr"
          label="Mitgliedernummer"
          component={renderUserDropdown}
          readOnly={props.readOnly}
          normalize={user => {
            if (user) {
              props.change('firstname', user.firstname);
              props.change('lastname', user.lastname);
              props.change('phone', user.phone);
              return user.memberNr;
            }
            return null;
          }}
        />
      </FieldSet>
      <FieldSet>
        <Field
          name="lastname"
          type="text"
          label="Nachname"
          component={renderInputField}
          readOnly={props.readOnly}
        />
        <Field
          name="firstname"
          type="text"
          label="Vorname"
          component={renderInputField}
          readOnly={props.readOnly}
        />
      </FieldSet>
      <FieldSet>
        <Field
          name="email"
          type="email"
          label="E-Mail"
          component={renderInputField}
          readOnly={props.readOnly}
        />
        <Field
          name="phone"
          type="text"
          label="Telefon"
          component={renderInputField}
          readOnly={props.readOnly}
        />
      </FieldSet>
      <WizardNavigation previousStep={previousPage} cancel={props.cancel}/>
    </form>
  );
};

PilotPage.propTypes = {
  previousPage: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
};

export default reduxForm({
  form: 'wizard',
  destroyOnUnmount: false,
  validate: validate(null, ['memberNr', 'lastname', 'firstname', 'email', 'phone']),
})(PilotPage);
