import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Button from '../../Button';
import PasskeyListItem from './PasskeyListItem';
import type { Passkey } from '../../../modules/auth';

const Section = styled.div`
  padding: 1em;
  border: 1px solid #ddd;
  background-color: #fefefe;
  box-shadow: 0 -1px 0 rgba(0,0,0,.03), 0 0 2px rgba(0,0,0,.03), 0 2px 4px rgba(0,0,0,.06);
`;

const SectionTitle = styled.h1`
  font-weight: bold;
  font-size: 1.5em;
  margin-bottom: 0.5em;
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 1em;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  margin-bottom: 1em;
`;

const EmptyNotice = styled.div`
  color: #888;
  font-style: italic;
  margin-bottom: 1em;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5em;
`;

const ErrorNotice = styled.div`
  color: #ed351c;
  margin: 0.5em 0;
`;

interface PasskeyManagerProps {
  passkeys: Passkey[];
  submitting: boolean;
  failure: boolean;
  errorMessage?: string;
  removalFailure: boolean;
  removalErrorMessage?: string;
  loadPasskeys: () => void;
  registerPasskey: () => void;
  removePasskey: (credentialId: string) => void;
}

const PasskeyManager: React.FC<PasskeyManagerProps> = ({
  passkeys,
  submitting,
  failure,
  errorMessage,
  removalFailure,
  removalErrorMessage,
  loadPasskeys,
  registerPasskey,
  removePasskey,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    loadPasskeys();
  }, []);

  const supported = typeof window !== 'undefined' && !!(window as any).PublicKeyCredential;

  return (
    <Section data-cy="passkey-manager">
      <SectionTitle>{t('profile.passkeysTitle')}</SectionTitle>
      <Description>{t('profile.passkeysDescription')}</Description>

      {passkeys.length === 0 ? (
        <EmptyNotice>{t('profile.passkeysEmpty')}</EmptyNotice>
      ) : (
        <List>
          {passkeys.map(p => (
            <PasskeyListItem
              key={p.credentialId}
              passkey={p}
              onRemove={removePasskey}
            />
          ))}
        </List>
      )}

      {failure && (
        <ErrorNotice>
          {errorMessage || t('profile.passkeysRegistrationFailure')}
        </ErrorNotice>
      )}

      {removalFailure && (
        <ErrorNotice>
          {removalErrorMessage || t('profile.passkeysRemovalFailure')}
        </ErrorNotice>
      )}

      {supported && (
        <Actions>
          <Button
            type="button"
            label={t('profile.passkeysRegister')}
            icon="add"
            onClick={() => registerPasskey()}
            loading={submitting}
            disabled={submitting}
            primary
            dataCy="register-passkey"
          />
        </Actions>
      )}
    </Section>
  );
};

export default PasskeyManager;
