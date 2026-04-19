import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Button from '../Button';

const DISMISS_TS_KEY = 'passkeyPromptDismissedAt';
const DISMISS_COUNT_KEY = 'passkeyPromptDismissCount';
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SUCCESS_DISMISS_MS = 3500;

const Wrapper = styled.div`
  border-radius: 10px;
  background-color: ${props => props.theme.colors.background};
  padding: 1em;
  flex: 1 1 300px;
  min-width: 280px;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const Title = styled.h3`
  color: ${props => props.theme.colors.main};
  margin: 0 0 0.5em;
  font-size: 1.1em;
`;

const Description = styled.p`
  margin: 0 0 1em;
  font-size: 0.95em;
  line-height: 1.4;
`;

const DismissLink = styled.button`
  background: none;
  border: none;
  color: #999;
  font-size: 0.85em;
  cursor: pointer;
  margin-top: auto;
  padding: 1.5em 0 0;
  display: block;
`;

const ErrorMessage = styled.p`
  color: #ed351c;
  font-size: 0.9em;
  margin: 0.75em 0 0;
`;

function getDismissCount(): number {
  try {
    return parseInt(window.localStorage.getItem(DISMISS_COUNT_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

function isDismissed(): boolean {
  const count = getDismissCount();
  if (count >= 2) return true;
  if (count === 1) {
    try {
      const ts = parseInt(window.localStorage.getItem(DISMISS_TS_KEY) || '0', 10);
      if (Date.now() - ts < DISMISS_TTL_MS) return true;
    } catch {
      // ignore
    }
  }
  return false;
}

function markDismissed(): void {
  try {
    const next = getDismissCount() + 1;
    window.localStorage.setItem(DISMISS_COUNT_KEY, String(next));
    window.localStorage.setItem(DISMISS_TS_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

interface Props {
  show: boolean;
  submitting: boolean;
  failure: boolean;
  loadPasskeys: () => void;
  registerPasskey: () => void;
}

const PostLoginPasskeyPrompt: React.FC<Props> = ({
  show,
  submitting,
  failure,
  loadPasskeys,
  registerPasskey,
}) => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(isDismissed());
  const nextDismissIsPermanent = getDismissCount() >= 1;
  const [wasSubmitting, setWasSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (show) {
      loadPasskeys();
    }
  }, [show]);

  useEffect(() => {
    if (wasSubmitting && !submitting && !failure) {
      // Don't call markDismissed() here — the persistent dismiss counter is
      // reserved for explicit user dismissals. After a successful
      // registration the passkeys.length === 0 gate already hides the tile,
      // and if the user later removes all passkeys the tile should return.
      setShowSuccess(true);
    }
    setWasSubmitting(submitting);
  }, [submitting, failure]);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => setDismissed(true), SUCCESS_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [showSuccess]);

  if (dismissed) return null;

  if (showSuccess) {
    return (
      <Wrapper data-cy="passkey-prompt-success">
        <Title>{t('profile.passkeyPromptSuccessTitle')}</Title>
        <Description>{t('profile.passkeyPromptSuccessDescription')}</Description>
      </Wrapper>
    );
  }

  if (!show) return null;

  const supported = typeof window !== 'undefined' && !!(window as any).PublicKeyCredential;
  if (!supported) return null;

  const handleDismiss = () => {
    markDismissed();
    setDismissed(true);
  };

  return (
    <Wrapper data-cy="passkey-prompt">
      <Title>{t('profile.passkeyPromptTitle')}</Title>
      <Description>{t('profile.passkeyPromptDescription')}</Description>
      <Button
        type="button"
        label={t('profile.passkeyPromptRegister')}
        onClick={() => registerPasskey()}
        loading={submitting}
        disabled={submitting}
        primary
        dataCy="passkey-prompt-register"
      />
      {failure && (
        <ErrorMessage data-cy="passkey-prompt-error">
          {t('profile.passkeysRegistrationFailure')}
        </ErrorMessage>
      )}
      <DismissLink
        type="button"
        onClick={handleDismiss}
        data-cy="passkey-prompt-dismiss"
      >
        {nextDismissIsPermanent ? t('profile.passkeyPromptDismissPermanent') : t('profile.passkeyPromptDismiss')}
      </DismissLink>
    </Wrapper>
  );
};

export default PostLoginPasskeyPrompt;
