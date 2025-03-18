import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {Field, getFormValues, reduxForm} from 'redux-form';
import validate from '../validate';
import {renderAircraftCategoryDropdown, renderAircraftDropdown, renderInputField} from '../renderField';
import FieldSet from '../FieldSet';
import WizardNavigation from '../../WizardNavigation';
import {getAircraftOrigin, updateGoAroundFees, updateLandingFees} from '../../../util/landingFees'

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
              props.change('aircraftCategory', aircraft.category)

              const flightType = formValues['flightType'];
              const landingCount = formValues['landingCount'];
              const goAroundCount = formValues['goAroundCount'];
              const aircraftOrigin = getAircraftOrigin(aircraft.key, aircraftSettings);

              updateLandingFees(props.change, aircraft.mtow, flightType, aircraftOrigin, aircraft.category, landingCount);
              updateGoAroundFees(props.change, aircraft.mtow, flightType, aircraftOrigin, aircraft.category, goAroundCount);

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
            const aircraftCategory = formValues['aircraftCategory']
            const flightType = formValues['flightType']
            const landingCount = formValues['landingCount']
            const goAroundCount = formValues['goAroundCount']
            const aircraftOrigin = getAircraftOrigin(formValues['immatriculation'], props.aircraftSettings);

            updateLandingFees(props.change, mtow, flightType, aircraftOrigin, aircraftCategory, landingCount)
            updateGoAroundFees(props.change, mtow, flightType, aircraftOrigin, aircraftCategory, goAroundCount)

            return mtow
          }}
        />
        <Field
          name="aircraftCategory"
          component={renderAircraftCategoryDropdown}
          label="Kategorie"
          readOnly={props.readOnly}
          normalize={aircraftCategory => {
            const mtow = formValues['mtow']
            const flightType = formValues['flightType']
            const landingCount = formValues['landingCount']
            const goAroundCount = formValues['goAroundCount']
            const aircraftOrigin = getAircraftOrigin(formValues['immatriculation'], props.aircraftSettings);

            updateLandingFees(props.change, mtow, flightType, aircraftOrigin, aircraftCategory, landingCount)
            updateGoAroundFees(props.change, mtow, flightType, aircraftOrigin, aircraftCategory, goAroundCount)

            return aircraftCategory
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
  validate: validate(null, ['immatriculation', 'aircraftType', 'mtow', 'aircraftCategory']),
})(connect(mapStateToProps)(AircraftPage));
