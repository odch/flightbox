import PropTypes from 'prop-types';
import React from 'react';
import { Field, reduxForm } from 'redux-form';
import validate from '../../validate';
import { renderSingleSelect, renderTextArea } from '../../renderField';
import FieldSet from '../../FieldSet';
import WizardNavigation from '../../../WizardNavigation';

const FlightPage = (props) => {
  const { previousPage, handleSubmit, flightTypes, runways, departureRoutes } = props;
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
        />
        <Field
          name="runway"
          component={renderSingleSelect}
          items={runways}
          parse={e => e.target.value}
          label="Pistenrichtung"
          readOnly={props.readOnly}
        />
        <Field
          name="departureRoute"
          component={renderSingleSelect}
          items={departureRoutes}
          orientation="vertical"
          parse={e => e.target.value}
          label="Abflugroute"
          readOnly={props.readOnly}
        />
        <Field
          name="route"
          component={renderTextArea}
          label="Routing"
          readOnly={props.readOnly}
        />
        <Field
          name="remarks"
          component={renderTextArea}
          label="Bemerkungen"
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
  departureRoutes: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    description: PropTypes.string,
  })).isRequired,
};

export default reduxForm({
  form: 'wizard',
  destroyOnUnmount: false,
  validate: validate('departure', ['flightType', 'runway', 'departureRoute', 'route', 'remarks']),
})(FlightPage);
