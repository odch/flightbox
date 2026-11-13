import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Field, Form } from 'react-final-form';
import { renderInputField } from '../wizards/renderField';
import FieldSet from '../wizards/FieldSet';
import LabeledBox from '../LabeledBox';
import Button from '../Button';
import styled from 'styled-components';

const FieldGroup = styled.div`
  margin-bottom: 1.5em;
  padding-bottom: 1.5em;
  border-bottom: 1px solid #eee;

  &:last-of-type {
    border-bottom: none;
    margin-bottom: 1em;
    padding-bottom: 0;
  }
`;

const HelpText = styled.p`
  color: #666;
  font-size: 0.9em;
  margin: 0.25em 0 0 0;
`;

const ErrorText = styled.p`
  color: #dc3545;
  margin: 0.25em 0 0 0;
`;

// The same limit as on the server (functions/ppr/domain/pprSettings.js)
const MAX_PPR_RETENTION_DAYS = 3650;

const parseDays = (value: string) => {
  if (value === '') return '';
  const num = parseInt(value, 10);
  return isNaN(num) ? '' : num;
};

interface PprSettingsProps {
  retentionDays: number | null;
  loaded: boolean;
  loadFailed: boolean;
  saving: boolean;
  saveFailed: boolean;
}

interface PrivacySettingsFormProps {
  privacyPolicyUrl: { url: string | null; saving: boolean };
  movementRetentionDays: { days: number | null; saving: boolean };
  messageRetentionDays: { days: number | null; saving: boolean };
  setPrivacyPolicyUrl: (url: string | null) => void;
  setMovementRetentionDays: (days: number | null) => void;
  setMessageRetentionDays: (days: number | null) => void;
  // The privacy settings (privacySettings) and the PPR retention (ppr) are
  // enabled per aerodrome
  privacyEnabled?: boolean;
  pprEnabled?: boolean;
  pprSettings?: PprSettingsProps;
  loadPprSettings?: () => void;
  savePprSettings?: (settings: { retentionDays: number | null }) => void;
}

function PrivacySettingsForm(props: PrivacySettingsFormProps) {
  const { t } = useTranslation();
  const { privacyEnabled = true, pprEnabled = false, pprSettings } = props;
  // Only once loaded, so a failed load can't overwrite the stored value
  const pprReady = !!(pprEnabled && pprSettings && pprSettings.loaded);

  useEffect(() => {
    if (pprEnabled && props.loadPprSettings) {
      props.loadPprSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialValues = {
    privacyPolicyUrl: props.privacyPolicyUrl.url || '',
    movementRetentionDays: props.movementRetentionDays.days != null ? props.movementRetentionDays.days : '',
    messageRetentionDays: props.messageRetentionDays.days != null ? props.messageRetentionDays.days : '',
    pprRetentionDays: pprReady && pprSettings!.retentionDays != null ? pprSettings!.retentionDays : '',
  };

  const saving = (privacyEnabled && (
    props.privacyPolicyUrl.saving ||
    props.movementRetentionDays.saving ||
    props.messageRetentionDays.saving
  )) || (pprReady && pprSettings!.saving);

  const validate = (values: any) => {
    const days = values.pprRetentionDays;
    if (pprReady && days !== '' && days != null &&
      !(Number.isInteger(days) && days >= 1 && days <= MAX_PPR_RETENTION_DAYS)) {
      return { pprRetentionDays: t('privacy.pprRetentionDaysInvalid') };
    }
    return {};
  };

  const savePprRetention = (values: any) => {
    const days = values.pprRetentionDays === '' || values.pprRetentionDays == null ? null : values.pprRetentionDays;
    if (days !== pprSettings!.retentionDays && props.savePprSettings) {
      props.savePprSettings({ retentionDays: days });
    }
  };

  const savePrivacySettings = (values: any) => {
    const url = values.privacyPolicyUrl ? values.privacyPolicyUrl.trim() : null;
    props.setPrivacyPolicyUrl(url || null);

    const movementDays = values.movementRetentionDays !== '' && values.movementRetentionDays != null
      ? parseInt(values.movementRetentionDays, 10)
      : null;
    props.setMovementRetentionDays(isNaN(movementDays as number) ? null : movementDays);

    const messageDays = values.messageRetentionDays !== '' && values.messageRetentionDays != null
      ? parseInt(values.messageRetentionDays, 10)
      : null;
    props.setMessageRetentionDays(isNaN(messageDays as number) ? null : messageDays);
  };

  const handleSubmit = (values: any) => {
    if (privacyEnabled) {
      savePrivacySettings(values);
    }
    if (pprReady) {
      savePprRetention(values);
    }
  };

  return (
    <LabeledBox label={t('privacy.title')}>
      <Form onSubmit={handleSubmit} validate={validate} initialValues={initialValues} keepDirtyOnReinitialize>
        {({ handleSubmit, dirty }) => (
          <form onSubmit={handleSubmit}>
            {privacyEnabled && (<>
              <FieldGroup>
                <FieldSet gutter={false}>
                  <Field
                    name="privacyPolicyUrl"
                    type="url"
                    label={t('privacy.privacyPolicyUrl')}
                    component={renderInputField}
                  />
                </FieldSet>
                <HelpText>{t('privacy.privacyPolicyUrlHelp')}</HelpText>
              </FieldGroup>

              <FieldGroup>
                <FieldSet gutter={false}>
                  <Field
                    name="movementRetentionDays"
                    type="number"
                    label={t('privacy.movementRetentionDays')}
                    component={renderInputField}
                    parse={parseDays}
                  />
                </FieldSet>
                <HelpText>{t('privacy.movementRetentionDaysHelp')}</HelpText>
              </FieldGroup>

              <FieldGroup>
                <FieldSet gutter={false}>
                  <Field
                    name="messageRetentionDays"
                    type="number"
                    label={t('privacy.messageRetentionDays')}
                    component={renderInputField}
                    parse={parseDays}
                  />
                </FieldSet>
                <HelpText>{t('privacy.messageRetentionDaysHelp')}</HelpText>
              </FieldGroup>
            </>)}

            {pprEnabled && (
              <FieldGroup>
                {pprSettings && pprSettings.loadFailed && <ErrorText>{t('ppr.settings.loadFailed')}</ErrorText>}
                {pprReady && (<>
                  <FieldSet gutter={false}>
                    <Field
                      name="pprRetentionDays"
                      type="number"
                      label={t('privacy.pprRetentionDays')}
                      component={renderInputField}
                      parse={parseDays}
                    />
                  </FieldSet>
                  <HelpText>{t('privacy.pprRetentionDaysHelp')}</HelpText>
                  {pprSettings!.saveFailed && <ErrorText>{t('privacy.pprRetentionDaysSaveFailed')}</ErrorText>}
                </>)}
              </FieldGroup>
            )}

            <Button
              type="submit"
              label={t('privacy.save')}
              icon="save"
              disabled={!dirty || saving}
              loading={saving}
              primary
            />
          </form>
        )}
      </Form>
    </LabeledBox>
  );
}

export default PrivacySettingsForm;
