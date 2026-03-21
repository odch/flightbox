import PropTypes from 'prop-types';
import React from 'react';
import {Field, Form} from 'react-final-form';
import { useTranslation } from 'react-i18next';
import validate from '../../validate';
import {renderSingleSelect, renderTextArea} from '../../renderField';
import FieldSet from '../../FieldSet';
import WizardNavigation from '../../../WizardNavigation';
import CircuitsFieldHint from '../../CircuitsFieldHint';
import PrivacyConsentText from '../../../PrivacyConsentText';

const FlightPage = (props) => {
  const { t } = useTranslation();
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
    departureRoute,
    privacyPolicyUrl
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
              label={t('wizard.flightType')}
              readOnly={readOnly}
            />
            <Field
              name="runway"
              component={renderSingleSelect}
              items={runways}
              label={t('wizard.runway')}
              readOnly={readOnly}
              hidden={hiddenFields && hiddenFields.includes('runway')}
            />
            <Field
              name="departureRoute"
              component={renderSingleSelect}
              items={departureRoutes}
              orientation="vertical"
              label={t('wizard.departureRoute')}
              readOnly={readOnly}
              hint={departureRoute === 'circuits' && <CircuitsFieldHint/>}
            />
            <Field
              name="route"
              component={renderTextArea}
              label={t('wizard.routing')}
              readOnly={readOnly}
            />
            <Field
              name="remarks"
              component={renderTextArea}
              label={t('wizard.remarks')}
              readOnly={readOnly}
            />
          </FieldSet>
          {!formValues.key && (
            <PrivacyConsentText privacyPolicyUrl={privacyPolicyUrl} />
          )}
          <WizardNavigation
            previousStep={() => previousPage(form.getState().values)}
            nextLabel={t('wizard.save')}
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
  hiddenFields: PropTypes.arrayOf(PropTypes.string),
  privacyPolicyUrl: PropTypes.string,
};

export default FlightPage;
