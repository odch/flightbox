import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {Field, Form} from 'react-final-form';
import validate from '../../validate';
import {renderAerodromeDropdown, renderDateField, renderIncrementationField, renderTimeField} from '../../renderField';
import FieldSet from '../../FieldSet';
import WizardNavigation from '../../../WizardNavigation';
import {getAircraftOrigin, updateFeesTotal, updateGoAroundFees, updateLandingFees} from '../../../../util/landingFees'

const toNumber = value => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.match(/\d+/)) {
    return parseInt(value, 10);
  }
  return undefined;
};

const DepartureArrivalPage = (props) => {
  const { previousPage, onSubmit, cancel, formValues, aircraftSettings, readOnly, hiddenFields } = props;
  return (
    <Form
      initialValues={formValues}
      validate={validate('arrival', ['location', 'date', 'time', 'landingCount'], hiddenFields)}
      onSubmit={onSubmit}
    >
      {({handleSubmit, form}) => (
        <form onSubmit={handleSubmit} className="DepartureArrivalPage">
          <FieldSet>
            <Field
              name="location"
              readOnly={readOnly}
            >
              {({input, meta}) =>
                renderAerodromeDropdown({
                  input: {
                    ...input,
                    onChange: aerodrome => {
                      form.change('location', aerodrome ? aerodrome.key : null)
                    }
                  },
                  meta,
                  label: "Startflugplatz",
                })
              }
            </Field>
          </FieldSet>
          <FieldSet>
            <Field
              name="date"
              component={renderDateField}
              parse={e => e.value}
              label="Datum"
              readOnly={readOnly}
            />
            <Field
              name="time"
              component={renderTimeField}
              parse={e => e.value}
              label="Landezeit (Lokalzeit)"
              readOnly={readOnly}
            />
          </FieldSet>
          <FieldSet>
            <Field name="landingCount" format={toNumber}>
              {({ input, meta }) =>
                renderIncrementationField({
                  input: {
                    ...input,
                    onChange: (eventOrValue) => {
                      input.onChange(eventOrValue);

                      const nextLandingCount = eventOrValue && eventOrValue.target ? eventOrValue.target.value : eventOrValue;
                      const values = form.getState().values;
                      const mtow = values.mtow;
                      const aircraftCategory = values.aircraftCategory;
                      const flightType = values.flightType;
                      const aircraftOrigin = getAircraftOrigin(values.immatriculation, aircraftSettings);

                      const landingFeeTotal = updateLandingFees(form.change, mtow, flightType, aircraftOrigin, aircraftCategory, nextLandingCount);
                      updateFeesTotal(form.change, landingFeeTotal, values.goAroundFeeTotal, flightType, aircraftOrigin, aircraftCategory);
                    },
                  },
                  meta,
                  name: input.name,
                  label: "Anzahl Landungen",
                  readOnly,
                })
              }
            </Field>
            <Field name="goAroundCount" format={toNumber}>
              {({ input, meta }) =>
                renderIncrementationField({
                  input: {
                    ...input,
                    onChange: (eventOrValue) => {
                      input.onChange(eventOrValue);

                      const nextGoAroundCount = eventOrValue && eventOrValue.target ? eventOrValue.target.value : eventOrValue;
                      const values = form.getState().values;
                      const mtow = values.mtow;
                      const aircraftCategory = values.aircraftCategory;
                      const flightType = values.flightType;
                      const aircraftOrigin = getAircraftOrigin(values.immatriculation, aircraftSettings);

                      const goAroundFeeTotal = updateGoAroundFees(form.change, mtow, flightType, aircraftOrigin, aircraftCategory, nextGoAroundCount);
                      updateFeesTotal(form.change, values.landingFeeTotal, goAroundFeeTotal, flightType, aircraftOrigin, aircraftCategory);
                    },
                  },
                  meta,
                  name: input.name,
                  label: "Anzahl Durchstarts (ohne Aufsetzen)",
                  readOnly,
                })
              }
            </Field>
          </FieldSet>
          <WizardNavigation previousStep={() => previousPage(form.getState().values)} cancel={cancel}/>
        </form>
      )}
    </Form>
  );
};

DepartureArrivalPage.propTypes = {
  previousPage: PropTypes.func.isRequired,
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

export default connect(mapStateToProps)(DepartureArrivalPage);
