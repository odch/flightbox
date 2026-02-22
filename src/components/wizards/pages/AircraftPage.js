import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {Field, Form} from 'react-final-form'
import validate from '../validate';
import {renderAircraftCategoryDropdown, renderAircraftDropdown, renderInputField} from '../renderField';
import FieldSet from '../FieldSet';
import WizardNavigation from '../../WizardNavigation';
import {getAircraftOrigin, updateFeesTotal, updateGoAroundFees, updateLandingFees} from '../../../util/landingFees'

const AircraftPage = (props) => {
  const {onSubmit, formValues, aircraftSettings} = props;
  return (
    <Form
      initialValues={formValues}
      onSubmit={onSubmit}
      validate={validate(
        null,
        ['immatriculation', 'aircraftType', 'mtow', 'aircraftCategory'],
        props.hiddenFields
      )}
    >
      {({handleSubmit, form}) => (
        <form onSubmit={handleSubmit} className="AircraftPage">
          <FieldSet>
            <Field name="immatriculation">
              {({ input, meta }) =>
                renderAircraftDropdown({
                  input: {
                    ...input,
                    onChange: (aircraft) => {
                      if (aircraft) {
                        form.change('immatriculation', aircraft.key)
                        form.change('aircraftType', aircraft.type);
                        form.change('mtow', aircraft.mtow);
                        form.change('aircraftCategory', aircraft.category)

                        if (form.getState().values['type'] === 'arrival') {
                          const values = form.getState().values;
                          const flightType = values.flightType;
                          const landingCount = values.landingCount;
                          const goAroundCount = values.goAroundCount;
                          const aircraftOrigin = getAircraftOrigin(aircraft.key, aircraftSettings);

                          const landingFeeTotal = updateLandingFees(form.change, aircraft.mtow, flightType, aircraftOrigin, aircraft.category, landingCount);
                          const goAroundFeeTotal = updateGoAroundFees(form.change, aircraft.mtow, flightType, aircraftOrigin, aircraft.category, goAroundCount);

                          updateFeesTotal(form.change, landingFeeTotal, goAroundFeeTotal, flightType, aircraftOrigin, aircraft.category);
                        }
                      } else {
                        form.change('immatriculation', null)
                      }
                    }
                  },
                  meta,
                  label: "Immatrikulation",
                  readOnly: props.readOnly,
                })
              }
            </Field>
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
            >
              {({ input, meta }) =>
                renderInputField({
                  input: {
                    ...input,
                    onChange: (eventOrValue) => {
                      input.onChange(eventOrValue);

                      if (form.getState().values['type'] === 'arrival') {
                        const values = form.getState().values;
                        const mtow = values.mtow;
                        const aircraftCategory = values.aircraftCategory;
                        const flightType = values.flightType;
                        const landingCount = values.landingCount;
                        const goAroundCount = values.goAroundCount;
                        const aircraftOrigin = getAircraftOrigin(values.immatriculation, props.aircraftSettings);

                        const landingFeeTotal = updateLandingFees(form.change, mtow, flightType, aircraftOrigin, aircraftCategory, landingCount);
                        const goAroundFeeTotal = updateGoAroundFees(form.change, mtow, flightType, aircraftOrigin, aircraftCategory, goAroundCount);

                        updateFeesTotal(form.change, landingFeeTotal, goAroundFeeTotal, flightType, aircraftOrigin, aircraftCategory);
                      }
                    },
                  },
                  meta,
                  label: "Maximales Abfluggewicht (in Kilogramm)",
                  type: "number",
                  readOnly: props.readOnly,
                })
              }
            </Field>
            <Field name="aircraftCategory">
              {({ input, meta }) => (
                renderAircraftCategoryDropdown({
                  input: {
                    ...input,
                    onChange: (aircraftCategory) => {
                      input.onChange(aircraftCategory);

                      if (form.getState().values['type'] === 'arrival') {
                        const values = form.getState().values;
                        const mtow = values.mtow;
                        const flightType = values.flightType;
                        const landingCount = values.landingCount;
                        const goAroundCount = values.goAroundCount;
                        const aircraftOrigin = getAircraftOrigin(values.immatriculation, props.aircraftSettings);

                        const landingFeeTotal = updateLandingFees(form.change, mtow, flightType, aircraftOrigin, aircraftCategory, landingCount);
                        const goAroundFeeTotal = updateGoAroundFees(form.change, mtow, flightType, aircraftOrigin, aircraftCategory, goAroundCount);

                        updateFeesTotal(form.change, landingFeeTotal, goAroundFeeTotal, flightType, aircraftOrigin, aircraftCategory);
                      }
                    },
                  },
                  meta,
                  label: "Kategorie",
                  readOnly: props.readOnly,
                })
              )}
            </Field>
          </FieldSet>
          <WizardNavigation previousVisible={false} cancel={props.cancel}/>
        </form>
      )}
    </Form>
  );
};

AircraftPage.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  formValues: PropTypes.object.isRequired,
  aircraftSettings: PropTypes.shape({
    club: PropTypes.objectOf(PropTypes.bool),
    homeBase: PropTypes.objectOf(PropTypes.bool)
  }).isRequired
};

const mapStateToProps = state => ({
  aircraftSettings: state.settings.aircrafts
});

export default connect(mapStateToProps)(AircraftPage);
