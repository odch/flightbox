import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Field, useField } from 'react-final-form';
import styled from 'styled-components';
import Input from '../Input';
import ValidationMessage from '../LabeledComponent/ValidationMessage';

const Fieldset = styled.fieldset`
  border: none;
  margin: 1.5em 0 0;
  padding: 0;
`;

const Legend = styled.legend`
  margin-bottom: 0.75em;
  padding: 0;
  font-weight: bold;
`;

// A checkbox beside its text, which may wrap: the line below starts under
// the text, not under the checkbox
const Option = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.6em;
  margin-bottom: 0.6em;

  & > input {
    flex-shrink: 0;
    margin: 0;
  }

  label {
    cursor: pointer;
  }
`;

const OptionText = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5em;
`;

// The limit with its unit: on the next line together where they don't fit
const Limit = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 0.5em;
  white-space: nowrap;
`;

const MtowInput = styled(Input)`
  width: 5em;
  padding: 0.2em 0;
  font-size: 1em;
  text-align: right;

  &:disabled {
    color: #999;
  }
`;

const HelpText = styled.p`
  color: #666;
  font-size: 0.9em;
  line-height: 1.4;
  margin: 0.25em 0 0 0;
`;

/**
 * The requests an admin answers also with automatic answers: those for
 * helicopters, and for aircraft from an MTOW. Fields manualHelicopters,
 * manualMtow (the limit is on) and manualMtowFrom (the limit as typed).
 */
const ManualAnswersFields = () => {
  const { t } = useTranslation();
  const limitOn = useField('manualMtow', { type: 'checkbox', subscription: { value: true } }).input.checked;
  const helicoptersId = useId();
  const mtowId = useId();
  return (
    <Fieldset data-cy="ppr-manual-answers">
      <Legend>{t('ppr.settings.manualAnswers')}</Legend>
      <Option>
        <Field name="manualHelicopters" type="checkbox">
          {({ input }) => <input {...input} id={helicoptersId} type="checkbox" data-cy="ppr-manual-helicopters"/>}
        </Field>
        <label htmlFor={helicoptersId}>{t('ppr.settings.manualHelicopters')}</label>
      </Option>
      <Field name="manualMtowFrom">
        {({ input: limit, meta }) => (
          <>
            {(meta.touched || meta.submitFailed) && meta.error && <ValidationMessage error={meta.error}/>}
            <Option>
              <Field name="manualMtow" type="checkbox">
                {({ input }) => <input {...input} id={mtowId} type="checkbox" data-cy="ppr-manual-mtow"/>}
              </Field>
              <OptionText>
                <label htmlFor={mtowId}>{t('ppr.settings.manualMtowFrom')}</label>
                <Limit>
                  {/* Text with the keypad of numbers: the form checks it with
                      its own message, where a number field would refuse it */}
                  <MtowInput
                    {...limit}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    disabled={!limitOn}
                    aria-label={t('ppr.settings.manualMtowLimit')}
                    data-cy="ppr-manual-mtow-from"
                  />
                  <span>{t('ppr.settings.manualMtowUnit')}</span>
                </Limit>
              </OptionText>
            </Option>
          </>
        )}
      </Field>
      <HelpText>{t('ppr.settings.manualAnswersHelp')}</HelpText>
    </Fieldset>
  );
};

export default ManualAnswersFields;
