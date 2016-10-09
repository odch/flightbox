import React, { PropTypes } from 'react';
import { Field, reduxForm } from 'redux-form';
import validate from '../validate';
import { renderInputField } from '../renderField';

const PilotPage = (props) => {
  const { previousPage, handleSubmit } = props;
  return (
    <form onSubmit={handleSubmit} className="PilotPage">
      <fieldset>
        <legend>Pilot</legend>
        <Field
          name="memberNr"
          type="text"
          label="MFGT-Mitgliedernummer"
          component={renderInputField}
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
  validate,
})(PilotPage);
