import React from 'react';
import styled from 'styled-components';
import {useTranslation} from 'react-i18next';
import {Field, Form} from 'react-final-form';
import Button from '../Button';
import Input from '../Input';
import ValidationMessage from '../LabeledComponent/ValidationMessage';
import {CreateApiKeyCallback, CreateApiKeyPayload} from '../../modules/apiKeys';
import {
  REQUIRED_SCOPES,
  requiresPersonalDataConfirmation,
  scopeLabel,
  toggleScope,
} from './scopes';

const NAME_MAX_LENGTH = 60;

// 'unlimited' is sent as expiresInMonths: null.
const EXPIRY_OPTIONS = ['3', '6', '12', '24', 'unlimited'];

const DEFAULT_EXPIRY = '12';

export interface CreateApiKeyFormValues {
  name: string;
  scopes: string[];
  confirmPersonalData: boolean;
  expiresInMonths: string;
}

// A module constant: react-final-form re-initialises the form whenever
// initialValues is a new object with a new (array) value.
const INITIAL_VALUES: CreateApiKeyFormValues = {
  name: '',
  scopes: [],
  confirmPersonalData: false,
  expiresInMonths: DEFAULT_EXPIRY,
};

type Translate = (key: string, options?: Record<string, unknown>) => string;

export const validate = (values: CreateApiKeyFormValues, t: Translate) => {
  const errors: Partial<Record<keyof CreateApiKeyFormValues, string>> = {};
  const name = (values.name || '').trim();
  const scopes = values.scopes || [];

  if (name.length === 0) {
    errors.name = t('apiAccess.create.nameRequired');
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = t('apiAccess.create.nameTooLong', {max: NAME_MAX_LENGTH});
  }

  if (scopes.length === 0) {
    errors.scopes = t('apiAccess.create.scopesRequired');
  } else {
    const missing = scopes.find(scope => REQUIRED_SCOPES[scope] && !scopes.includes(REQUIRED_SCOPES[scope]));
    if (missing) {
      errors.scopes = t('apiAccess.create.requiresScope', {scope: scopeLabel(t, REQUIRED_SCOPES[missing])});
    }
  }

  if (requiresPersonalDataConfirmation(scopes) && values.confirmPersonalData !== true) {
    errors.confirmPersonalData = t('apiAccess.create.confirmPersonalDataRequired');
  }

  return errors;
};

export const toPayload = (values: CreateApiKeyFormValues, availableScopes: string[]): CreateApiKeyPayload => {
  // Sent in the order of availableScopes, whatever order they were checked in.
  const scopes = availableScopes.filter(scope => (values.scopes || []).includes(scope));
  return {
    name: values.name.trim(),
    scopes,
    expiresInMonths: values.expiresInMonths === 'unlimited' ? null : Number(values.expiresInMonths),
    confirmPersonalData: requiresPersonalDataConfirmation(scopes) && values.confirmPersonalData === true,
  };
};

const Group = styled.div`
  margin-bottom: 1.5em;
`;

const GroupLabel = styled.label`
  display: block;
  font-weight: bold;
  margin-bottom: 0.5em;
`;

const Fieldset = styled.fieldset`
  border: none;
  margin: 0 0 1.5em 0;
  padding: 0;
`;

const Legend = styled.legend`
  font-weight: bold;
  margin-bottom: 0.5em;
  padding: 0;
`;

const NameInput = styled(Input)`
  width: 100%;
  max-width: 30em;
  font-size: 1em;
  padding: 0.3em 0;
`;

const Hint = styled.div`
  color: #666;
  font-size: 0.9em;
  margin-top: 0.3em;
`;

const CheckboxLabel = styled.label<{ $disabled?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.6em;
  margin-bottom: 0.6em;
  line-height: 1.3em;
  cursor: ${props => props.$disabled ? 'default' : 'pointer'};
  color: ${props => props.$disabled ? '#999' : 'inherit'};

  input {
    margin-top: 0.2em;
    flex-shrink: 0;
  }
`;

const ScopeOption = styled.div`
  margin-bottom: 0.6em;

  label {
    margin-bottom: 0;
  }
`;

const ScopeHint = styled(Hint)`
  margin: 0.2em 0 0 1.9em;
`;

const Confirmation = styled.div`
  margin: 0.5em 0 0 0;
  padding: 0.75em;
  border-left: 3px solid ${props => props.theme.colors.danger};
  background-color: #fff8f7;
`;

const Select = styled.select`
  font-size: 1em;
  padding: 0.3em;
  min-width: 12em;
`;

const ErrorText = styled.p`
  color: ${props => props.theme.colors.danger};
`;

interface CreateApiKeyFormProps {
  availableScopes: string[];
  creating: boolean;
  createError: string | null;
  onCreate: (payload: CreateApiKeyPayload, onCreated: CreateApiKeyCallback) => void;
  // Receives the plaintext key (see ApiAccess: it is held in component state only).
  onKeyCreated: CreateApiKeyCallback;
}

const CreateApiKeyForm = ({availableScopes, creating, createError, onCreate, onKeyCreated}: CreateApiKeyFormProps) => {
  const {t} = useTranslation();
  const translate = t as unknown as Translate;

  const expiryLabel = (option: string) => option === 'unlimited'
    ? t('apiAccess.create.unlimited')
    : t('apiAccess.create.months', {count: Number(option)});

  return (
    <Form<CreateApiKeyFormValues>
      onSubmit={(values, form) => {
        onCreate(toPayload(values, availableScopes), key => {
          if (!onKeyCreated(key)) {
            return false;
          }
          form.restart(INITIAL_VALUES);
          return true;
        });
      }}
      initialValues={INITIAL_VALUES}
      validate={values => validate(values, translate)}
    >
      {({handleSubmit, form, values}) => (
        <form onSubmit={handleSubmit} noValidate>
          <Field name="name">
            {({input, meta}) => (
              <Group>
                <GroupLabel htmlFor="api-key-name">{t('apiAccess.create.name')}</GroupLabel>
                {meta.touched && meta.error && <ValidationMessage error={meta.error}/>}
                <NameInput
                  {...input}
                  id="api-key-name"
                  type="text"
                  autoComplete="off"
                  disabled={creating}
                  aria-describedby="api-key-name-hint"
                  data-cy="api-key-name"
                />
                <Hint id="api-key-name-hint">{t('apiAccess.create.nameHint')}</Hint>
              </Group>
            )}
          </Field>

          <Field name="scopes">
            {({input, meta}) => {
              const scopes: string[] = Array.isArray(input.value) ? input.value : [];
              const handleChange = (scope: string, checked: boolean) => {
                const next = toggleScope(scopes, scope, checked);
                input.onChange(next);
                input.onBlur();
                if (!requiresPersonalDataConfirmation(next)) {
                  form.change('confirmPersonalData', false);
                }
              };
              return (
                <Fieldset>
                  <Legend>{t('apiAccess.create.scopes')}</Legend>
                  {meta.touched && meta.error && <ValidationMessage error={meta.error}/>}
                  {availableScopes.map(scope => {
                    const required = REQUIRED_SCOPES[scope];
                    const blocked = required !== undefined && !scopes.includes(required);
                    const hintId = `api-key-scope-hint-${scope.replace(/[^a-z0-9]/gi, '-')}`;
                    return (
                      <ScopeOption key={scope}>
                        <CheckboxLabel $disabled={blocked}>
                          <input
                            type="checkbox"
                            name="scopes"
                            value={scope}
                            checked={scopes.includes(scope)}
                            disabled={blocked || creating}
                            onChange={e => handleChange(scope, e.target.checked)}
                            aria-describedby={blocked ? hintId : undefined}
                            data-cy={`scope-${scope}`}
                          />
                          <span>{scopeLabel(translate, scope)}</span>
                        </CheckboxLabel>
                        {blocked && (
                          <ScopeHint id={hintId}>
                            {t('apiAccess.create.requiresScope', {scope: scopeLabel(translate, required)})}
                          </ScopeHint>
                        )}
                      </ScopeOption>
                    );
                  })}
                  {requiresPersonalDataConfirmation(values.scopes || []) && (
                    <Field name="confirmPersonalData" type="checkbox">
                      {({input: confirmInput, meta: confirmMeta}) => (
                        <Confirmation>
                          {confirmMeta.touched && confirmMeta.error && <ValidationMessage error={confirmMeta.error}/>}
                          <CheckboxLabel>
                            <input
                              {...confirmInput}
                              type="checkbox"
                              disabled={creating}
                              data-cy="confirm-personal-data"
                            />
                            <span>{t('apiAccess.create.confirmPersonalData')}</span>
                          </CheckboxLabel>
                        </Confirmation>
                      )}
                    </Field>
                  )}
                </Fieldset>
              );
            }}
          </Field>

          <Group>
            <GroupLabel htmlFor="api-key-expiry">{t('apiAccess.create.expiry')}</GroupLabel>
            <Field name="expiresInMonths">
              {({input}) => (
                <Select {...input} id="api-key-expiry" disabled={creating} data-cy="api-key-expiry">
                  {EXPIRY_OPTIONS.map(option => (
                    <option key={option} value={option}>{expiryLabel(option)}</option>
                  ))}
                </Select>
              )}
            </Field>
          </Group>

          {createError && (
            <ErrorText role="alert">
              {t(createError === 'forbidden' ? 'apiAccess.forbidden' : 'apiAccess.create.failed')}
            </ErrorText>
          )}

          <Button
            type="submit"
            label={t('apiAccess.create.submit')}
            icon="vpn_key"
            primary
            disabled={creating}
            loading={creating}
            dataCy="api-key-create"
          />
        </form>
      )}
    </Form>
  );
};

export default CreateApiKeyForm;
