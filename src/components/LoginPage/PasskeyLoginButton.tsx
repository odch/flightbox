import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Button from '../Button';

const StyledButton = styled(Button)`
  margin-top: 1em;
  margin-bottom: 0.5em;
  width: 100%;
`;

const FailureWrapper = styled.div`
  color: #ed351c;
  margin-top: 0.5em;
  font-size: 0.9em;
`;

interface PasskeyLoginButtonProps {
  email?: string;
  submitting: boolean;
  failure: boolean;
  loginWithPasskey: (email?: string) => void;
}

const PasskeyLoginButton: React.FC<PasskeyLoginButtonProps> = ({
  email,
  submitting,
  failure,
  loginWithPasskey,
}) => {
  const { t } = useTranslation();

  if (typeof window === 'undefined' || !(window as any).PublicKeyCredential) {
    return null;
  }

  const hasEmail = typeof email === 'string' && email.length > 0;

  const handleClick = () => {
    loginWithPasskey(hasEmail ? email : undefined);
  };

  return (
    <div data-cy="passkey-login">
      <StyledButton
        type="button"
        label={t('login.signInWithPasskey')}
        icon="send"
        disabled={submitting}
        loading={submitting}
        onClick={handleClick}
        dataCy="passkey-login-button"
      />
      {failure && (
        <FailureWrapper>
          {t('login.passkeyFailure')}
        </FailureWrapper>
      )}
    </div>
  );
};

export default PasskeyLoginButton;
