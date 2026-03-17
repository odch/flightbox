import React, { useRef, useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import Failure from './Failure';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
`;

const Instruction = styled.p`
  margin: 0;
  font-size: 0.95rem;
  text-align: center;
  color: #444;
`;

const OtpInputsRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

interface DigitInputProps {
  $filled: boolean;
}

const DigitInput = styled.input<DigitInputProps>`
  width: 2.8rem;
  height: 3.2rem;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  border: 2px solid ${({ $filled }) => ($filled ? '#aaa' : '#ddd')};
  border-radius: 8px;
  outline: none;
  caret-color: transparent;
  background-color: ${({ $filled }) => ($filled ? '#f8f9fa' : '#fff')};
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
  color: #222;

  &:focus {
    border-color: ${({ theme }) => theme.colors.main};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.main}33;
    background-color: #fff;
  }

  @media (max-width: 360px) {
    width: 2.2rem;
    height: 2.8rem;
    font-size: 1.2rem;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
`;

const ResendButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 0.85rem;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.main};
  text-decoration: underline;

  &:disabled {
    color: #aaa;
    text-decoration: none;
    cursor: default;
  }
`;

interface OtpCodeFormProps {
  email: string;
  submitting: boolean;
  failure: boolean;
  onSubmit: (code: string) => void;
  onResend?: () => void;
}

const OtpCodeForm: React.FC<OtpCodeFormProps> = ({ email, submitting, failure, onSubmit, onResend }) => {
  const { t } = useTranslation();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const focusInput = useCallback((index: number) => {
    const el = inputRefs.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  const handleResend = useCallback(() => {
    if (onResend && cooldown === 0) {
      onResend();
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setDigits(Array(CODE_LENGTH).fill(''));
      setTimeout(() => focusInput(0), 0);
    }
  }, [onResend, cooldown, focusInput]);

  const submitCode = useCallback((code: string) => {
    if (code.length === CODE_LENGTH && !submitting) {
      onSubmit(code);
    }
  }, [onSubmit, submitting]);

  const handleChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setDigits(prev => {
      const next = [...prev];
      next[index] = digit;
      if (digit && index < CODE_LENGTH - 1) {
        setTimeout(() => focusInput(index + 1), 0);
      }
      const code = next.join('');
      if (code.length === CODE_LENGTH && next.every(d => d !== '')) {
        setTimeout(() => submitCode(code), 0);
      }
      return next;
    });
  }, [focusInput, submitCode]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) {
        setDigits(prev => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
      } else if (index > 0) {
        setDigits(prev => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
        focusInput(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1);
    } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      focusInput(index + 1);
    }
  }, [digits, focusInput]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;

    const next = Array(CODE_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);

    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    setTimeout(() => focusInput(focusIndex), 0);

    if (pasted.length === CODE_LENGTH) {
      setTimeout(() => submitCode(pasted), 0);
    }
  }, [focusInput, submitCode]);

  const code = digits.join('');
  const isComplete = code.length === CODE_LENGTH && digits.every(d => d !== '');

  return (
    <Wrapper>
      <Instruction>
        {t('login.otpInstruction')} <strong>{email}</strong>
      </Instruction>
      <OtpInputsRow onPaste={handlePaste} role="group" aria-label={t('login.otpAriaLabel')}>
        {digits.map((digit, index) => (
          <DigitInput
            key={index}
            ref={el => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            autoFocus={index === 0}
            disabled={submitting}
            $filled={digit !== ''}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            aria-label={`${t('login.otpDigitLabel')} ${index + 1}`}
            data-cy={`otp-digit-${index}`}
          />
        ))}
      </OtpInputsRow>
      {failure && <Failure failure={failure} />}
      <Actions>
        <Button
          type="button"
          label={t('login.loginButton')}
          icon="send"
          disabled={submitting || !isComplete}
          primary
          dataCy="otp-submit"
          loading={submitting}
          onClick={() => submitCode(code)}
        />
        {onResend && (
          <ResendButton
            type="button"
            disabled={cooldown > 0}
            onClick={handleResend}
            data-cy="otp-resend"
          >
            {cooldown > 0
              ? t('login.otpResendIn', { seconds: cooldown })
              : t('login.otpResend')}
          </ResendButton>
        )}
      </Actions>
    </Wrapper>
  );
};

export default OtpCodeForm;
