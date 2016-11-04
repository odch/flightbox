import React, { PropTypes } from 'react';
import { Field, reduxForm } from 'redux-form';
import validate from '../validate';
import { renderInputField, renderUserDropdown } from '../renderField';

const PilotPage = (props) => {
  const { previousPage, handleSubmit } = props;
  return (
    <form onSubmit={handleSubmit} className="PilotPage">
      <fieldset>
        <legend>Pilot</legend>
        <Field
          name="memberNr"
          label="MFGT-Mitgliedernummer"
          component={renderUserDropdown}
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
        />
        <Field
          name="lastname"
          type="text"
          label="Nachname"
          component={renderInputField}
        />
        <Field
          name="firstname"
          type="text"
          label="Vorname"
          component={renderInputField}
        />
      </fieldset>
      <div className="WizardNavigation">
        <button type="button" className="previous" onClick={previousPage}>Zurück</button>
        <button type="submit" className="next">Weiter</button>
      </div>
    </form>
  );
};

PilotPage.propTypes = {
  previousPage: PropTypes.func,
  handleSubmit: PropTypes.func,
};

export default reduxForm({
  form: 'wizard',
  destroyOnUnmount: false,
  validate: validate(['memberNr', 'phone', 'lastname', 'firstname']),
})(PilotPage);
