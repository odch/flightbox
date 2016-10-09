import React, { PropTypes } from 'react';
import { Field, reduxForm } from 'redux-form';
import validate from '../validate';
import { renderInputField } from '../renderField';

const AircraftPage = (props) => {
  const { handleSubmit } = props;
  return (
    <form onSubmit={handleSubmit} className="AircraftPage">
      <fieldset>
        <legend>Flugzeugdaten</legend>
        <Field
          name="immatriculation"
          type="text"
          component={renderInputField}
          label="Immatrikulation"
        />
        <Field
          name="aircraftType"
          type="text"
          component={renderInputField}
          label="Typ"
        />
        <Field
          name="mtow"
          type="number"
          component={renderInputField}
          label="Maximales Abfluggewicht (in Kilogramm)"
        />
      </fieldset>
      <div className="WizardNavigation">
        <button type="submit" className="next">Weiter</button>
      </div>
    </form>
  );
};

AircraftPage.propTypes = {
  handleSubmit: PropTypes.func,
};

export default reduxForm({
  form: 'wizard',
  destroyOnUnmount: false,
  validate,
})(AircraftPage);
