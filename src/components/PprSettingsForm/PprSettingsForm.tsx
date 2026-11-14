import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Field, Form } from 'react-final-form';
import styled from 'styled-components';
import { renderInputField, renderSingleSelect, renderTextArea } from '../wizards/renderField';
import FieldSet from '../wizards/FieldSet';
import Button from '../Button';
import dates from '../../util/dates';
import ClosuresEditor, {
  ClosureError,
  ClosureValue,
  MAX_CLOSURE_REASON_LENGTH,
  upcomingClosures,
} from './ClosuresEditor';
import PprSettingsSummary from './PprSettingsSummary';
import useMinWidth from './useMinWidth';
import useSavedHint from './useSavedHint';

const Section = styled.div`
  margin-bottom: 1.5em;
  padding-bottom: 1.5em;
  border-bottom: 1px solid #eee;
`;

const SectionTitle = styled.h3`
  font-size: 1.1em;
  margin: 0 0 1em 0;
`;

const HelpText = styled.p`
  color: #666;
  font-size: 0.9em;
  line-height: 1.4;
  margin: 0.25em 0 1em 0;
`;

// The modes side by side where both descriptions fit, else one below the
// other; either way across the box
const MIN_WIDTH_SIDE_BY_SIDE = 600;

const AnswerMode = styled.div`
  & > div {
    width: 100%;
    margin-right: 0;
  }
`;

const AnswerModeField = ({ items, label }: { items: { value: string; label: string; description: string }[]; label: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const sideBySide = useMinWidth(ref, MIN_WIDTH_SIDE_BY_SIDE);
  return (
    <AnswerMode ref={ref}>
      <Field
        name="answerMode"
        component={renderSingleSelect}
        items={items}
        orientation={sideBySide ? 'horizontal' : 'vertical'}
        label={label}
      />
    </AnswerMode>
  );
};

// A text of several lines: its own row at full width, in the size of the
// closures, with its help right below
const PilotInfo = styled.div`
  & > div {
    width: 100%;
    margin-right: 0;
    margin-bottom: 0;
  }

  & textarea {
    font-size: 1.1em;
    line-height: 1.4;
  }
`;

const Warning = styled.p`
  color: #dc3545;
  margin: 0 0 1em 0;
`;

const SaveError = styled.p`
  color: ${props => props.theme.colors.danger};
  margin: 0 0 1em 0;
`;

// Read out by screen readers only
const ScreenReaderText = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

// Right-aligned like the button of the summary, across the box on small
// screens
const Buttons = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5em;

  @media (max-width: 768px) {
    > * {
      flex: 1 1 auto;
    }
  }
`;

// The same rules as on the server (functions/ppr/domain/pprRequest.js and
// pprSettings.js)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PILOT_INFO_LENGTH = 1000;

interface FormValues {
  answerMode: 'manual' | 'automatic';
  pilotInfo: string;
  adminEmail: string;
  closures: ClosureValue[];
}

const trimmedOrNull = (value?: string | null) => (value || '').trim() || null;

const validateClosure = (closure: ClosureValue, t: (key: string, options?: any) => string) => {
  const error: ClosureError = {};
  if (!closure.from || !closure.to) {
    error.dates = t('ppr.settings.closureDatesRequired');
  } else if (closure.to < closure.from) {
    error.dates = t('ppr.settings.closureOrder');
  }
  const reason = (closure.reason || '').trim();
  if (!reason) {
    error.reason = t('ppr.settings.closureReasonRequired');
  } else if (reason.length > MAX_CLOSURE_REASON_LENGTH) {
    error.reason = t('ppr.settings.tooLong', { max: MAX_CLOSURE_REASON_LENGTH });
  }
  // Rows without errors stay undefined: final-form counts any other value,
  // null included, as an error
  return Object.keys(error).length > 0 ? error : undefined;
};

/**
 * The PPR settings: a summary, and the form to change them once an admin
 * chooses to.
 */
const PprSettingsForm = (props: any) => {
  const { t } = useTranslation();
  const { settings, loadPprSettings } = props;
  const [editing, setEditing] = useState(false);
  // A save started in the form failed: shown until the next save or until
  // the form opens again
  const [saveFailed, setSaveFailed] = useState(false);
  const { visible: savedHintVisible, show: showSavedHint, hide: hideSavedHint } = useSavedHint();

  useEffect(() => {
    loadPprSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The button that switches between the summary and the form is gone
  // after the switch: the focus goes on to the form, or back to the button
  // "Bearbeiten", unless it was moved elsewhere in the meantime
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const focusAfterSwitch = useRef(false);
  const switchTo = useCallback((edit: boolean) => {
    focusAfterSwitch.current = true;
    setEditing(edit);
  }, []);

  useEffect(() => {
    if (!focusAfterSwitch.current) {
      return;
    }
    focusAfterSwitch.current = false;
    if (document.activeElement && document.activeElement !== document.body) {
      return;
    }
    if (editing) {
      formRef.current?.focus();
    } else {
      summaryRef.current?.querySelector<HTMLElement>('[data-cy="ppr-settings-edit"]')?.focus();
    }
  }, [editing]);

  const startEditing = () => {
    hideSavedHint();
    setSaveFailed(false);
    switchTo(true);
  };

  // The result of a save started in the form closes it, or keeps it open
  // with the error. Results that are there already (from an earlier visit,
  // or from the privacy tab, which saves the same settings) and saves
  // started elsewhere are not the form's.
  const wasSaving = useRef(!!settings.saving);
  const savingFromForm = useRef(false);
  useEffect(() => {
    const saving = !!settings.saving;
    if (saving === wasSaving.current) {
      return;
    }
    wasSaving.current = saving;
    if (saving) {
      savingFromForm.current = editing;
      setSaveFailed(false);
      hideSavedHint();
    } else if (savingFromForm.current) {
      savingFromForm.current = false;
      if (settings.saved) {
        switchTo(false);
        showSavedHint();
      } else if (settings.saveFailed) {
        setSaveFailed(true);
      }
    }
  }, [settings.saving, settings.saved, settings.saveFailed, editing, switchTo, showSavedHint, hideSavedHint]);

  // The form starts from the stored settings each time it opens; recreated
  // only when other settings are stored, so it doesn't start over while
  // saving. Closures that have ended are left out, and so are removed by
  // the next save.
  const initialValues: FormValues = useMemo(() => ({
    answerMode: settings.answerMode === 'automatic' ? 'automatic' : 'manual',
    pilotInfo: settings.pilotInfo || '',
    adminEmail: settings.adminEmail || '',
    closures: upcomingClosures<ClosureValue>(settings.closures, dates.localDate())
      .map(closure => ({ from: closure.from, to: closure.to, reason: closure.reason })),
  }), [settings.answerMode, settings.pilotInfo, settings.adminEmail, settings.closures]);

  const answerModes = [
    {
      value: 'manual',
      label: t('ppr.settings.answerManual'),
      description: t('ppr.settings.answerManualHelp'),
    },
    {
      value: 'automatic',
      label: t('ppr.settings.answerAutomatic'),
      description: t('ppr.settings.answerAutomaticHelp'),
    },
  ];

  const validate = (values: FormValues) => {
    const errors: Record<string, any> = {};
    const email = (values.adminEmail || '').trim();
    if (email && !EMAIL_REGEX.test(email)) {
      errors.adminEmail = t('ppr.settings.invalidEmail');
    }
    if ((values.pilotInfo || '').trim().length > MAX_PILOT_INFO_LENGTH) {
      errors.pilotInfo = t('ppr.settings.tooLong', { max: MAX_PILOT_INFO_LENGTH });
    }
    const closureErrors = (values.closures || []).map(closure => validateClosure(closure, t));
    if (closureErrors.some(Boolean)) {
      errors.closures = closureErrors;
    }
    return errors;
  };

  const handleSubmit = (values: FormValues) => {
    props.savePprSettings({
      answerMode: values.answerMode,
      // Kept while answering manually, for a later return to automatic
      pilotInfo: trimmedOrNull(values.pilotInfo),
      adminEmail: trimmedOrNull(values.adminEmail),
      closures: (values.closures || []).map(closure => ({
        from: closure.from,
        to: closure.to,
        reason: closure.reason.trim(),
      })),
    });
  };

  if (settings.loadFailed) {
    return <Warning>{t('ppr.settings.loadFailed')}</Warning>;
  }

  if (!settings.loaded) {
    return null;
  }

  // The confirmation of a save for screen readers, shown to the eye by the
  // summary: a live region after the summary and the form, so it stays on
  // the page while they take turns. Screen readers announce changes of a
  // live region, not a new one with its text.
  const savedStatus = (
    <ScreenReaderText role="status" data-cy="ppr-settings-saved-status">
      {savedHintVisible && !editing ? t('common.saved') : null}
    </ScreenReaderText>
  );

  if (!editing) {
    return (
      <>
        <div ref={summaryRef}>
          <PprSettingsSummary
            answerMode={settings.answerMode}
            adminEmail={settings.adminEmail}
            closures={settings.closures}
            saved={savedHintVisible}
            onEdit={startEditing}
          />
        </div>
        {savedStatus}
      </>
    );
  }

  // Describes the stored settings: unanswered requests nobody hears about
  const unannounced = !settings.adminEmail && settings.answerMode !== 'automatic';

  return (
    <>
      <Form onSubmit={handleSubmit} validate={validate} initialValues={initialValues}>
        {({ handleSubmit, dirty, values }) => (
          // Focusable, to be focused when it opens
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            tabIndex={-1}
            aria-label={t('ppr.settings.title')}
            data-cy="ppr-settings-form"
          >
            <Section>
              <SectionTitle>{t('ppr.settings.answer')}</SectionTitle>
              <FieldSet gutter={false}>
                <AnswerModeField items={answerModes} label={t('ppr.settings.answerMode')}/>
              </FieldSet>
              {values.answerMode === 'automatic' && (
                <PilotInfo>
                  <Field
                    name="pilotInfo"
                    component={renderTextArea}
                    rows={5}
                    maxLength={MAX_PILOT_INFO_LENGTH}
                    label={t('ppr.settings.pilotInfo')}
                  />
                  <HelpText>{t('ppr.settings.pilotInfoHelp')}</HelpText>
                </PilotInfo>
              )}
            </Section>

            <Section>
              <SectionTitle>{t('ppr.settings.closures')}</SectionTitle>
              <HelpText>{t('ppr.settings.closuresHelp')}</HelpText>
              <Field name="closures">
                {({ input, meta }) => (
                  <ClosuresEditor
                    value={input.value || []}
                    onChange={input.onChange}
                    errors={Array.isArray(meta.error) ? meta.error : undefined}
                    showAllErrors={!!meta.submitFailed}
                  />
                )}
              </Field>
            </Section>

            <Section>
              <SectionTitle>{t('ppr.settings.notification')}</SectionTitle>
              <FieldSet gutter={false}>
                <Field
                  name="adminEmail"
                  type="email"
                  label={t('ppr.settings.adminEmail')}
                  component={renderInputField}
                />
              </FieldSet>
              <HelpText>{t('ppr.settings.adminEmailHelp')}</HelpText>
              {unannounced && <Warning>{t('ppr.settings.noAdminEmail')}</Warning>}
            </Section>

            {saveFailed && <SaveError role="alert">{t('ppr.settings.saveFailed')}</SaveError>}
            <Buttons>
              <Button
                type="button"
                label={t('common.cancel')}
                onClick={() => switchTo(false)}
                disabled={settings.saving}
                flat
                dataCy="ppr-settings-cancel"
              />
              <Button
                type="submit"
                label={t('common.save')}
                icon="save"
                disabled={!dirty || settings.saving}
                loading={settings.saving}
                primary
                dataCy="ppr-settings-save"
              />
            </Buttons>
          </form>
        )}
      </Form>
      {savedStatus}
    </>
  );
};

export default PprSettingsForm;
