import React from 'react';
import { act } from 'react-dom/test-utils';
import { renderWithTheme, screen, fireEvent } from '../../../test/renderWithTheme';
import OtpCodeForm from './OtpCodeForm';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey, values }: { i18nKey: string; values?: Record<string, string> }) =>
    values?.email ? `${i18nKey} ${values.email}` : i18nKey,
}));

jest.mock('../MaterialIcon', () => {
  const React = require('react');
  return function MockMaterialIcon({ icon }: { icon: string }) {
    return <span data-testid={`icon-${icon}`} />;
  };
});

const baseProps = {
  email: 'test@example.com',
  submitting: false,
  failure: false,
  onSubmit: jest.fn(),
};

function getDigits() {
  return screen.getAllByRole('textbox');
}

function fillDigits(digits: string[]) {
  const inputs = getDigits();
  digits.forEach((d, i) => {
    fireEvent.change(inputs[i], { target: { value: d } });
  });
}

function pasteIntoGroup(text: string) {
  const group = screen.getByRole('group');
  fireEvent.paste(group, {
    clipboardData: { getData: () => text },
  });
}

// The resend cooldown ticks 1 second at a time via recursive useEffect+setTimeout.
// Advancing fake time in 1-second increments lets React flush effects between ticks.
function advanceCooldown(seconds = 60) {
  for (let i = 0; i < seconds; i++) {
    act(() => { jest.advanceTimersByTime(1000); });
  }
}

describe('OtpCodeForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  // ─── Rendering ────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders 6 digit inputs', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      expect(getDigits()).toHaveLength(6);
    });

    it('renders the instruction containing the email address', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      expect(screen.getByText(/test@example\.com/)).toBeInTheDocument();
    });

    it('does not render resend button when onResend is not provided', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      expect(screen.queryByText('login.otpResend')).not.toBeInTheDocument();
      expect(screen.queryByText('login.otpResendIn')).not.toBeInTheDocument();
    });

    it('renders resend button (in cooldown state) when onResend is provided', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} onResend={jest.fn()} />);
      expect(screen.getByText('login.otpResendIn')).toBeInTheDocument();
    });

    it('submit button is disabled when no digits are entered', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      expect(screen.getByRole('button', { name: /login.loginButton/ })).toBeDisabled();
    });

    it('all digit inputs are disabled when submitting is true', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} submitting={true} />);
      getDigits().forEach(input => expect(input).toBeDisabled());
    });

    it('submit button is disabled when submitting is true', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} submitting={true} />);
      expect(screen.getByRole('button', { name: /login.loginButton/ })).toBeDisabled();
    });
  });

  // ─── Failure message ──────────────────────────────────────────────────────

  describe('failure message', () => {
    it('does not show failure message when failure is false', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} failure={false} />);
      expect(screen.queryByText('login.otpVerificationFailure')).not.toBeInTheDocument();
    });

    it('shows OTP-specific failure message when failure is true', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} failure={true} />);
      expect(screen.getByText('login.otpVerificationFailure')).toBeInTheDocument();
    });
  });

  // ─── Digit input ──────────────────────────────────────────────────────────

  describe('digit input', () => {
    it('fills a digit when a numeric character is typed', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      const inputs = getDigits();
      fireEvent.change(inputs[0], { target: { value: '7' } });
      expect(inputs[0]).toHaveValue('7');
    });

    it('ignores non-numeric input', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      const inputs = getDigits();
      fireEvent.change(inputs[0], { target: { value: 'a' } });
      expect(inputs[0]).toHaveValue('');
    });

    it('moves focus to next input after entering a digit', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      const inputs = getDigits();
      fireEvent.change(inputs[0], { target: { value: '5' } });
      act(() => { jest.runAllTimers(); });
      expect(document.activeElement).toBe(inputs[1]);
    });

    it('does not advance focus when entering a digit in the last input', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      const inputs = getDigits();
      inputs[5].focus();
      fireEvent.change(inputs[5], { target: { value: '9' } });
      // No error and focus stays on last input (or auto-submit fires)
      expect(inputs[5]).toHaveValue('9');
    });

    it('enables submit button when all 6 digits are entered', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      fillDigits(['1', '2', '3', '4', '5', '6']);
      expect(screen.getByRole('button', { name: /login.loginButton/ })).not.toBeDisabled();
    });
  });

  // ─── Backspace ────────────────────────────────────────────────────────────

  describe('backspace', () => {
    it('clears the current digit when backspace is pressed on a filled input', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      const inputs = getDigits();
      fireEvent.change(inputs[2], { target: { value: '4' } });
      fireEvent.keyDown(inputs[2], { key: 'Backspace' });
      expect(inputs[2]).toHaveValue('');
    });

    it('clears the previous digit and moves focus back when backspace is pressed on an empty input', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      const inputs = getDigits();
      fireEvent.change(inputs[0], { target: { value: '3' } });
      act(() => { jest.runAllTimers(); });
      // Focus is now on inputs[1], which is empty
      fireEvent.keyDown(inputs[1], { key: 'Backspace' });
      expect(inputs[0]).toHaveValue('');
      expect(document.activeElement).toBe(inputs[0]);
    });

    it('does not move focus before the first input on backspace', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      const inputs = getDigits();
      inputs[0].focus();
      fireEvent.keyDown(inputs[0], { key: 'Backspace' });
      expect(document.activeElement).toBe(inputs[0]);
    });
  });

  // ─── Arrow key navigation ─────────────────────────────────────────────────

  describe('arrow key navigation', () => {
    it('moves focus left on ArrowLeft', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      const inputs = getDigits();
      inputs[3].focus();
      fireEvent.keyDown(inputs[3], { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(inputs[2]);
    });

    it('moves focus right on ArrowRight', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      const inputs = getDigits();
      inputs[2].focus();
      fireEvent.keyDown(inputs[2], { key: 'ArrowRight' });
      expect(document.activeElement).toBe(inputs[3]);
    });

    it('does not move focus left of the first input', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      const inputs = getDigits();
      inputs[0].focus();
      fireEvent.keyDown(inputs[0], { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(inputs[0]);
    });

    it('does not move focus right of the last input', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      const inputs = getDigits();
      inputs[5].focus();
      fireEvent.keyDown(inputs[5], { key: 'ArrowRight' });
      expect(document.activeElement).toBe(inputs[5]);
    });
  });

  // ─── Paste ────────────────────────────────────────────────────────────────

  describe('paste', () => {
    it('fills all 6 digit inputs when a complete numeric code is pasted', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      pasteIntoGroup('123456');
      const inputs = getDigits();
      expect(inputs[0]).toHaveValue('1');
      expect(inputs[1]).toHaveValue('2');
      expect(inputs[2]).toHaveValue('3');
      expect(inputs[3]).toHaveValue('4');
      expect(inputs[4]).toHaveValue('5');
      expect(inputs[5]).toHaveValue('6');
    });

    it('strips non-numeric characters from pasted text', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      pasteIntoGroup('12-34-56');
      const inputs = getDigits();
      expect(inputs[0]).toHaveValue('1');
      expect(inputs[5]).toHaveValue('6');
    });

    it('fills only available slots when a partial code is pasted', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      pasteIntoGroup('123');
      const inputs = getDigits();
      expect(inputs[0]).toHaveValue('1');
      expect(inputs[1]).toHaveValue('2');
      expect(inputs[2]).toHaveValue('3');
      expect(inputs[3]).toHaveValue('');
    });

    it('auto-submits when a complete 6-digit code is pasted', () => {
      const onSubmit = jest.fn();
      renderWithTheme(<OtpCodeForm {...baseProps} onSubmit={onSubmit} />);
      pasteIntoGroup('654321');
      act(() => { jest.runAllTimers(); });
      expect(onSubmit).toHaveBeenCalledWith('654321');
    });

    it('does not auto-submit when a partial code is pasted', () => {
      const onSubmit = jest.fn();
      renderWithTheme(<OtpCodeForm {...baseProps} onSubmit={onSubmit} />);
      pasteIntoGroup('123');
      act(() => { jest.runAllTimers(); });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not submit when only non-numeric text is pasted', () => {
      const onSubmit = jest.fn();
      renderWithTheme(<OtpCodeForm {...baseProps} onSubmit={onSubmit} />);
      pasteIntoGroup('abcdef');
      act(() => { jest.runAllTimers(); });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  // ─── Auto-submit ──────────────────────────────────────────────────────────

  describe('auto-submit', () => {
    it('calls onSubmit with the complete code when all 6 digits are typed', () => {
      const onSubmit = jest.fn();
      renderWithTheme(<OtpCodeForm {...baseProps} onSubmit={onSubmit} />);
      fillDigits(['1', '2', '3', '4', '5', '6']);
      act(() => { jest.runAllTimers(); });
      expect(onSubmit).toHaveBeenCalledWith('123456');
    });

    it('does not auto-submit when only 5 digits are entered', () => {
      const onSubmit = jest.fn();
      renderWithTheme(<OtpCodeForm {...baseProps} onSubmit={onSubmit} />);
      fillDigits(['1', '2', '3', '4', '5']);
      act(() => { jest.runAllTimers(); });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  // ─── Submit button ────────────────────────────────────────────────────────

  describe('submit button click', () => {
    it('calls onSubmit when the submit button is clicked with all digits filled', () => {
      const onSubmit = jest.fn();
      renderWithTheme(<OtpCodeForm {...baseProps} onSubmit={onSubmit} />);
      fillDigits(['9', '8', '7', '6', '5', '4']);
      // Flush the auto-submit timer, then reset the mock to test the button separately
      act(() => { jest.runAllTimers(); });
      onSubmit.mockClear();

      fireEvent.click(screen.getByRole('button', { name: /login.loginButton/ }));
      expect(onSubmit).toHaveBeenCalledWith('987654');
    });
  });

  // ─── Change email ─────────────────────────────────────────────────────────

  describe('change email button', () => {
    it('does not render change email button when onChangeEmail is not provided', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} />);
      expect(screen.queryByText('login.otpChangeEmail')).not.toBeInTheDocument();
    });

    it('renders change email button when onChangeEmail is provided', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} onChangeEmail={jest.fn()} />);
      expect(screen.getByText('login.otpChangeEmail')).toBeInTheDocument();
    });

    it('calls onChangeEmail when the button is clicked', () => {
      const onChangeEmail = jest.fn();
      renderWithTheme(<OtpCodeForm {...baseProps} onChangeEmail={onChangeEmail} />);
      fireEvent.click(screen.getByText('login.otpChangeEmail'));
      expect(onChangeEmail).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Resend ───────────────────────────────────────────────────────────────

  describe('resend button', () => {
    it('is disabled during the initial cooldown period', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} onResend={jest.fn()} />);
      expect(screen.getByText('login.otpResendIn').closest('button')).toBeDisabled();
    });

    it('becomes enabled after the cooldown expires', () => {
      renderWithTheme(<OtpCodeForm {...baseProps} onResend={jest.fn()} />);
      advanceCooldown();
      expect(screen.getByText('login.otpResend').closest('button')).not.toBeDisabled();
    });

    it('calls onResend when clicked after cooldown expires', () => {
      const onResend = jest.fn();
      renderWithTheme(<OtpCodeForm {...baseProps} onResend={onResend} />);
      advanceCooldown();
      fireEvent.click(screen.getByText('login.otpResend'));
      expect(onResend).toHaveBeenCalledTimes(1);
    });

    it('resets the cooldown after resend, making the button disabled again', () => {
      const onResend = jest.fn();
      renderWithTheme(<OtpCodeForm {...baseProps} onResend={onResend} />);
      advanceCooldown();
      fireEvent.click(screen.getByText('login.otpResend'));
      // Cooldown is reset to 60; the "resendIn" text should be back
      expect(screen.getByText('login.otpResendIn').closest('button')).toBeDisabled();
    });

    it('clears all digit inputs after resend', () => {
      const onResend = jest.fn();
      renderWithTheme(<OtpCodeForm {...baseProps} onResend={onResend} />);
      fillDigits(['1', '2', '3', '4', '5', '6']);
      // Flush the auto-submit timer before advancing the cooldown
      act(() => { jest.runAllTimers(); });
      advanceCooldown();
      fireEvent.click(screen.getByText('login.otpResend'));
      act(() => { jest.runAllTimers(); });
      getDigits().forEach(input => expect(input).toHaveValue(''));
    });

    it('does not call onResend when clicked during the cooldown period', () => {
      const onResend = jest.fn();
      renderWithTheme(<OtpCodeForm {...baseProps} onResend={onResend} />);
      // Only advance 30s (cooldown still active)
      act(() => { jest.advanceTimersByTime(30000); });
      fireEvent.click(screen.getByText('login.otpResendIn'));
      expect(onResend).not.toHaveBeenCalled();
    });
  });
});
