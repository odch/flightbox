import React from 'react';
import { useTranslation } from 'react-i18next';
import { Field, Form } from 'react-final-form';
import { renderInputField } from '../wizards/renderField';
import FieldSet from '../wizards/FieldSet';
import LabeledBox from '../LabeledBox';
import Button from '../Button';
import styled from 'styled-components';

const HelpText = styled.p`
  color: #666;
  font-size: 0.9em;
  margin: 0.25em 0 1em 0;
`;

interface PrivacySettingsFormProps {
  privacyPolicyUrl: { url: string | null; saving: boolean };
  movementRetentionDays: { days: number | null; saving: boolean };
  messageRetentionDays: { days: number | null; saving: boolean };
  setPrivacyPolicyUrl: (url: string | null) => void;
  setMovementRetentionDays: (days: number | null) => void;
  setMessageRetentionDays: (days: number | null) => void;
}

function PrivacySettingsForm(props: PrivacySettingsFormProps) {
  const { t } = useTranslation();

  const initialValues = {
    privacyPolicyUrl: props.privacyPolicyUrl.url || '',
    movementRetentionDays: props.movementRetentionDays.days != null ? props.movementRetentionDays.days : '',
    messageRetentionDays: props.messageRetentionDays.days != null ? props.messageRetentionDays.days : '',
  };

  const saving =
    props.privacyPolicyUrl.saving ||
    props.movementRetentionDays.saving ||
    props.messageRetentionDays.saving;

  const handleSubmit = (values: any) => {
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

  return (
    <LabeledBox label={t('privacy.title')}>
      <Form onSubmit={handleSubmit} initialValues={initialValues}>
        {({ handleSubmit, dirty }) => (
          <form onSubmit={handleSubmit}>
            <FieldSet gutter={false}>
              <Field
                name="privacyPolicyUrl"
                type="url"
                label={t('privacy.privacyPolicyUrl')}
                component={renderInputField}
              />
            </FieldSet>
            <HelpText>{t('privacy.privacyPolicyUrlHelp')}</HelpText>

            <FieldSet gutter={false}>
              <Field
                name="movementRetentionDays"
                type="number"
                label={t('privacy.movementRetentionDays')}
                component={renderInputField}
                parse={(value: string) => {
                  if (value === '') return '';
                  const num = parseInt(value, 10);
                  return isNaN(num) ? '' : num;
                }}
              />
            </FieldSet>
            <HelpText>{t('privacy.movementRetentionDaysHelp')}</HelpText>

            <FieldSet gutter={false}>
              <Field
                name="messageRetentionDays"
                type="number"
                label={t('privacy.messageRetentionDays')}
                component={renderInputField}
                parse={(value: string) => {
                  if (value === '') return '';
                  const num = parseInt(value, 10);
                  return isNaN(num) ? '' : num;
                }}
              />
            </FieldSet>
            <HelpText>{t('privacy.messageRetentionDaysHelp')}</HelpText>

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
