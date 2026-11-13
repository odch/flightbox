import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Field, Form } from 'react-final-form';
import styled from 'styled-components';
import { renderInputField } from '../wizards/renderField';
import FieldSet from '../wizards/FieldSet';
import Button from '../Button';

const HelpText = styled.p`
  color: #666;
  font-size: 0.9em;
  margin: 0.25em 0 1em 0;
`;

const Warning = styled.p`
  color: #dc3545;
  margin: 0 0 1em 0;
`;

const Message = styled.p`
  margin: 0 0 1em 0;
`;

// The same rule as on the server (functions/ppr/domain/pprRequest.js)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PprSettingsForm = (props: any) => {
  const { t } = useTranslation();
  const { settings, loadPprSettings } = props;

  useEffect(() => {
    loadPprSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = (values: any) => {
    const email = (values.adminEmail || '').trim();
    return email && !EMAIL_REGEX.test(email) ? { adminEmail: t('ppr.settings.invalidEmail') } : {};
  };

  const handleSubmit = (values: any) => {
    props.savePprSettings({ adminEmail: (values.adminEmail || '').trim() || null });
  };

  if (settings.loadFailed) {
    return <Warning>{t('ppr.settings.loadFailed')}</Warning>;
  }

  if (!settings.loaded) {
    return null;
  }

  return (
    <Form onSubmit={handleSubmit} validate={validate} initialValues={{ adminEmail: settings.adminEmail || '' }}>
      {({ handleSubmit, dirty }) => (
        <form onSubmit={handleSubmit}>
          <FieldSet gutter={false}>
            <Field
              name="adminEmail"
              type="email"
              label={t('ppr.settings.adminEmail')}
              component={renderInputField}
            />
          </FieldSet>
          <HelpText>{t('ppr.settings.adminEmailHelp')}</HelpText>
          {!settings.adminEmail && <Warning>{t('ppr.settings.noAdminEmail')}</Warning>}
          {settings.saveFailed && <Warning>{t('ppr.settings.saveFailed')}</Warning>}
          {settings.saved && !dirty && <Message>{t('common.saved')}</Message>}
          <Button
            type="submit"
            label={t('common.save')}
            icon="save"
            disabled={!dirty || settings.saving}
            loading={settings.saving}
            primary
            dataCy="ppr-settings-save"
          />
        </form>
      )}
    </Form>
  );
};

export default PprSettingsForm;
