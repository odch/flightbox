import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import {Field, getFormValues, reduxForm} from 'redux-form';
import validate from '../../validate';
import { renderSingleSelect, renderTextArea } from '../../renderField';
import FieldSet from '../../FieldSet';
import WizardNavigation from '../../../WizardNavigation';
import {updateMovementFees} from "../../../../util/landingFees"

const FlightPage = (props) => {
  const { previousPage, handleSubmit, flightTypes, arrivalRoutes, runways, formValues } = props;
  return (
    <form onSubmit={handleSubmit} className="FlightPage">
      <FieldSet>
        <Field
          name="flightType"
          component={renderSingleSelect}
          items={flightTypes}
          orientation="vertical"
          parse={e => e.target.value}
          label="Typ"
          readOnly={props.readOnly}
          normalize={flightType => {
            const mtow = formValues['mtow']
            const landingCount = formValues['landingCount']

            updateMovementFees(props.change, mtow, flightType, landingCount)

            return flightType
          }}
        />
        <Field
          name="arrivalRoute"
          component={renderSingleSelect}
          items={arrivalRoutes}
          orientation="vertical"
          parse={e => e.target.value}
          label="Ankunftsroute"
          readOnly={props.readOnly}
        />
        <Field
          name="remarks"
          component={renderTextArea}
          label="Bemerkungen"
          readOnly={props.readOnly}
        />
        <Field
          name="runway"
          component={renderSingleSelect}
          items={runways}
          parse={e => e.target.value}
          label="Pistenrichtung"
          readOnly={props.readOnly}
        />
      </FieldSet>
      <WizardNavigation
        previousStep={previousPage}
        nextLabel="Speichern"
        nextVisible={!props.readOnly}
        cancel={props.cancel}
      />
    </form>
  );
};

const mapStateToProps = state => ({
  formValues: getFormValues('wizard')(state)
});

FlightPage.propTypes = {
  previousPage: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
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
  formValues: PropTypes.object.isRequired
};

export default reduxForm({
  form: 'wizard',
  destroyOnUnmount: false,
  validate: validate('arrival', ['flightType', 'arrivalRoute', 'remarks', 'runway']),
})(connect(mapStateToProps)(FlightPage));
