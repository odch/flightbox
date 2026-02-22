import PropTypes from 'prop-types';
import React from 'react';
import {Field, Form} from 'react-final-form';
import validate from '../../validate';
import {renderSingleSelect, renderTextArea} from '../../renderField';
import FieldSet from '../../FieldSet';
import WizardNavigation from '../../../WizardNavigation';
import CircuitsFieldHint from '../../CircuitsFieldHint';

const FlightPage = (props) => {
  const {
    previousPage,
    onSubmit,
    cancel,
    flightTypes,
    runways,
    departureRoutes,
    formValues,
    hiddenFields,
    readOnly,
    departureRoute
  } = props;
  return (
    <Form
      onSubmit={onSubmit}
      initialValues={formValues}
      validate={validate('departure', ['flightType', 'runway', 'departureRoute', 'route', 'remarks'], hiddenFields)}
    >
      {({handleSubmit, form}) => (
        <form onSubmit={handleSubmit} className="FlightPage">
          <FieldSet>
            <Field
              name="flightType"
              component={renderSingleSelect}
              items={flightTypes}
              orientation="vertical"
              label="Typ"
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
            <Field
              name="departureRoute"
              component={renderSingleSelect}
              items={departureRoutes}
              orientation="vertical"
              label="Abflugroute"
              readOnly={readOnly}
              hint={departureRoute === 'circuits' && <CircuitsFieldHint/>}
            />
            <Field
              name="route"
              component={renderTextArea}
              label="Routing"
              readOnly={readOnly}
            />
            <Field
              name="remarks"
              component={renderTextArea}
              label="Bemerkungen"
              readOnly={readOnly}
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
  departureRoutes: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    description: PropTypes.string,
  })).isRequired,
  departureRoute: PropTypes.string,
  hiddenFields: PropTypes.arrayOf(PropTypes.string)
};

export default FlightPage;
