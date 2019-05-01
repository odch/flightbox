import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Field, reduxForm, getFormValues } from 'redux-form';
import validate from '../validate';
import { renderInputField, renderAircraftDropdown } from '../renderField';
import FieldSet from '../FieldSet';
import WizardNavigation from '../../WizardNavigation';
import { updateMovementFees, getAircraftOrigin } from '../../../util/landingFees'

const AircraftPage = (props) => {
  const { handleSubmit, formValues, aircraftSettings } = props;
  return (
    <form onSubmit={handleSubmit} className="AircraftPage">
      <FieldSet>
        <Field
          name="immatriculation"
          component={renderAircraftDropdown}
          label="Immatrikulation"
          readOnly={props.readOnly}
          normalize={aircraft => {
            if (aircraft) {
              props.change('aircraftType', aircraft.type);
              props.change('mtow', aircraft.mtow);

              const flightType = formValues['flightType'];
              const landingCount = formValues['landingCount'];
              const aircraftOrigin = getAircraftOrigin(aircraft.key, aircraftSettings);

              updateMovementFees(props.change, aircraft.mtow, flightType, aircraftOrigin, landingCount);

              return aircraft.key;
            }
            return null;
          }}
        />
        <Field
          name="aircraftType"
          type="text"
          component={renderInputField}
          label="Typ"
          readOnly={props.readOnly}
        />
        <Field
          name="mtow"
          type="number"
          component={renderInputField}
          label="Maximales Abfluggewicht (in Kilogramm)"
          readOnly={props.readOnly}
          parse={input => {
            if (typeof input === 'number') {
              return input;
            }
            if (typeof input === 'string' && /^\d+$/.test(input)) {
              return parseInt(input);
            }
            return null;
          }}
          normalize={mtow => {
            const flightType = formValues['flightType']
            const landingCount = formValues['landingCount']
            const aircraftOrigin = getAircraftOrigin(formValues['immatriculation'], props.aircraftSettings);

            updateMovementFees(props.change, mtow, flightType, aircraftOrigin, landingCount)

            return mtow
          }}
        />
      </FieldSet>
      <WizardNavigation previousVisible={false} cancel={props.cancel}/>
    </form>
  );
};

AircraftPage.propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired,
  change: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  formValues: PropTypes.object.isRequired,
  aircraftSettings: PropTypes.shape({
    club: PropTypes.objectOf(PropTypes.bool),
    homeBase: PropTypes.objectOf(PropTypes.bool)
  }).isRequired
};

const mapStateToProps = state => ({
  formValues: getFormValues('wizard')(state),
  aircraftSettings: state.settings.aircrafts
});

export default reduxForm({
  form: 'wizard',
  destroyOnUnmount: false,
  validate: validate(null, ['immatriculation', 'aircraftType', 'mtow']),
})(connect(mapStateToProps)(AircraftPage));
