import PropTypes from 'prop-types';
import React from 'react';
import {Field, reduxForm} from 'redux-form';
import validate from '../validate';
import {renderInputField, renderUserDropdown} from '../renderField';
import FieldSet from '../FieldSet';
import WizardNavigation from '../../WizardNavigation';

const PilotPage = (props) => {
  const { previousPage, handleSubmit, isGuest } = props;
  return (
    <form onSubmit={handleSubmit} className="PilotPage">
      <FieldSet>
        {__CONF__.memberManagement === true &&!isGuest && (
          <Field
            name="memberNr"
            label="Mitgliedernummer"
            component={renderUserDropdown}
            readOnly={props.readOnly}
            normalize={user => {
              if (user) {
                return user.memberNr;
              }
              return null;
            }}
            onChange={user => {
              if (user) {
                props.change('firstname', user.firstname);
                props.change('lastname', user.lastname);
                props.change('email', user.email);
                props.change('phone', user.phone);
              }
            }}
          />
        )}
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
          masked={__CONF__.maskContactInformation === true && !props.isAdmin}
        />
        <Field
          name="phone"
          type="tel"
          label="Telefon"
          component={renderInputField}
          readOnly={props.readOnly}
          masked={__CONF__.maskContactInformation === true && !props.isAdmin}
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
  isAdmin: PropTypes.bool.isRequired,
  isGuest: PropTypes.bool.isRequired,
};

export default reduxForm({
  form: 'wizard',
  destroyOnUnmount: false,
  validate: validate(null, ['memberNr', 'lastname', 'firstname', 'email', 'phone']),
})(PilotPage);
