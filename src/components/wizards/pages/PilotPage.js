import React, { PropTypes } from 'react';
import { Field, reduxForm } from 'redux-form';
import validate from '../validate';
import { renderInputField, renderUserDropdown } from '../renderField';
import FieldSet from '../FieldSet';
import WizardNavigation from '../../WizardNavigation';

const PilotPage = (props) => {
  const { previousPage, handleSubmit } = props;
  return (
    <form onSubmit={handleSubmit} className="PilotPage">
      <FieldSet legend="Pilot">
        <Field
          name="memberNr"
          label="MFGT-Mitgliedernummer"
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
        <Field
          name="phone"
          type="text"
          label="Telefon"
          component={renderInputField}
          readOnly={props.readOnly}
        />
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
      <WizardNavigation previousStep={previousPage}/>
    </form>
  );
};

PilotPage.propTypes = {
  previousPage: PropTypes.func,
  handleSubmit: PropTypes.func,
  readOnly: PropTypes.bool,
};

export default reduxForm({
  form: 'wizard',
  destroyOnUnmount: false,
  validate: validate(null, ['memberNr', 'phone', 'lastname', 'firstname']),
})(PilotPage);
