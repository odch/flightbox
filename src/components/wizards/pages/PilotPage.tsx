import PropTypes from 'prop-types';
import React from 'react';
import {Field, Form} from 'react-final-form';
import { useTranslation } from 'react-i18next';
import validate from '../validate';
import {renderInputField, renderPhoneField} from '../renderField';
import FieldSet from '../FieldSet';
import WizardNavigation from '../../WizardNavigation';

const PilotPage = (props) => {
  const { t } = useTranslation();
  const { previousPage, onSubmit, isGuest, hiddenFields, formValues } = props;
  return (
    <Form
      initialValues={formValues}
      onSubmit={onSubmit}
      validate={validate(null, ['memberNr', 'lastname', 'firstname', 'email', 'phone'], hiddenFields)}
    >
      {({handleSubmit, form}) => (
        <form onSubmit={handleSubmit} className="PilotPage">
          <FieldSet>
            {__CONF__.memberManagement === true && !isGuest && (
              <Field
                name="memberNr"
                type="text"
                label={t('movement.details.memberNr')}
                component={renderInputField}
                readOnly={props.readOnly}
              />
            )}
          </FieldSet>
          <FieldSet>
            <Field
              name="lastname"
              type="text"
              label={t('movement.details.lastname')}
              component={renderInputField}
              readOnly={props.readOnly}
            />
            <Field
              name="firstname"
              type="text"
              label={t('movement.details.firstname')}
              component={renderInputField}
              readOnly={props.readOnly}
            />
          </FieldSet>
          <FieldSet>
            <Field
              name="email"
              type="email"
              label={t('movement.details.email')}
              component={renderInputField}
              readOnly={props.readOnly}
              masked={__CONF__.maskContactInformation === true && !props.isAdmin}
            />
            <Field
              name="phone"
              label={t('movement.details.phone')}
              component={renderPhoneField}
              readOnly={props.readOnly}
              masked={__CONF__.maskContactInformation === true && !props.isAdmin}
            />
          </FieldSet>
          <WizardNavigation previousStep={() => previousPage(form.getState().values)} cancel={props.cancel}/>
        </form>
      )}
      </Form>
  );
};

PilotPage.propTypes = {
  previousPage: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  isAdmin: PropTypes.bool.isRequired,
  isGuest: PropTypes.bool.isRequired,
  formValues: PropTypes.object.isRequired,
};

export default PilotPage;
