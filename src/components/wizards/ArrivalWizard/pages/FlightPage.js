import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {Field, Form} from 'react-final-form';
import validate from '../../validate';
import {renderSingleSelect, renderTextArea} from '../../renderField';
import FieldSet from '../../FieldSet';
import WizardNavigation from '../../../WizardNavigation';
import {getAircraftOrigin, updateFeesTotal, updateGoAroundFees, updateLandingFees} from '../../../../util/landingFees';
import CircuitsFieldHint from '../../CircuitsFieldHint';

const FlightPage = (props) => {
  const {
    previousPage,
    onSubmit,
    cancel,
    flightTypes,
    arrivalRoutes,
    runways,
    formValues,
    aircraftSettings,
    readOnly,
    hiddenFields,
    arrivalRoute
  } = props;
  return (
    <Form
      initialValues={formValues}
      onSubmit={onSubmit}
      validate={validate('arrival', ['flightType', 'arrivalRoute', 'remarks', 'runway'], hiddenFields)}
    >
      {({handleSubmit, form}) => (
        <form onSubmit={handleSubmit} className="FlightPage">
          <FieldSet>
            <Field name="flightType">
              {({ input, meta }) =>
                renderSingleSelect({
                  input: {
                    ...input,
                    onChange: (eventOrValue) => {
                      input.onChange(eventOrValue);

                      const nextFlightType = eventOrValue && eventOrValue.target ? eventOrValue.target.value : eventOrValue;
                      const values = form.getState().values;
                      const mtow = values.mtow;
                      const aircraftCategory = values.aircraftCategory;
                      const landingCount = values.landingCount;
                      const goAroundCount = values.goAroundCount;
                      const aircraftOrigin = getAircraftOrigin(values.immatriculation, aircraftSettings);

                      const landingFeeTotal = updateLandingFees(form.change, mtow, nextFlightType, aircraftOrigin, aircraftCategory, landingCount);
                      const goAroundFeeTotal = updateGoAroundFees(form.change, mtow, nextFlightType, aircraftOrigin, aircraftCategory, goAroundCount);

                      updateFeesTotal(form.change, landingFeeTotal, goAroundFeeTotal, nextFlightType, aircraftOrigin, aircraftCategory);
                    },
                  },
                  meta,
                  items: flightTypes,
                  orientation: "vertical",
                  label: "Typ",
                  readOnly: props.readOnly,
                })
              }
            </Field>
            <Field
              name="arrivalRoute"
              component={renderSingleSelect}
              items={arrivalRoutes}
              orientation="vertical"
              label="Ankunftsroute"
              readOnly={readOnly}
              hint={arrivalRoute === 'circuits' && <CircuitsFieldHint/>}
            />
            <Field
              name="remarks"
              component={renderTextArea}
              label="Bemerkungen"
              readOnly={readOnly}
            />
            <Field
              name="runway"
              component={renderSingleSelect}
              items={runways}
              label="Pistenrichtung"
              readOnly={readOnly}
              hidden={hiddenFields && hiddenFields.includes('runway')}
            />
          </FieldSet>
          <WizardNavigation
            previousStep={() => previousPage(form.getState().values)}
            nextLabel="Speichern"
            nextVisible={!readOnly}
            cancel={cancel}
          />
        </form>
      )}
    </Form>
  );
};

const mapStateToProps = state => ({
  aircraftSettings: state.settings.aircrafts
});

FlightPage.propTypes = {
  previousPage: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  flightTypes: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
  })).isRequired,
  runways: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
  })).isRequired,
  arrivalRoutes: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    description: PropTypes.string,
  })).isRequired,
  formValues: PropTypes.object.isRequired,
  aircraftSettings: PropTypes.shape({
    club: PropTypes.objectOf(PropTypes.bool),
    homeBase: PropTypes.objectOf(PropTypes.bool)
  }).isRequired,
  hiddenFields: PropTypes.arrayOf(PropTypes.string)
};

export default connect(mapStateToProps)(FlightPage);
