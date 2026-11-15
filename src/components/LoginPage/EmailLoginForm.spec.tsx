import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../MaterialIcon', () => () => null);

// The button of the guest session, with the label it is given
jest.mock('../../containers/GuestTokenLoginContainer', () => ({ label }: any) => (
  <button type="button" data-testid="guest-login">{label || 'default guest label'}</button>
));

import EmailLoginForm from './EmailLoginForm';

const theme: any = {
  colors: { main: '#003863', background: '#fafafa', danger: '#e00f00' },
};

// The token of the guest access, from the link
const TOKEN = '0f8fad5b-d9cb-469f-a165-70867728950e';

const renderForm = (props: object = {}) => render(
  <ThemeProvider theme={theme}>
    <EmailLoginForm
      sendAuthenticationEmail={jest.fn()}
      verifyOtpCode={jest.fn()}
      updateEmail={jest.fn()}
      resetOtp={jest.fn()}
      onCancel={jest.fn()}
      showCancel={false}
      email=""
      submitting={false}
      failure={false}
      emailSent={false}
      passkeysEnabled={false}
      {...props}
    />
  </ThemeProvider>
);

describe('EmailLoginForm', () => {
  describe('for the movements', () => {
    it('offers the guest session where the link carries the guest access token, with what each way gives', () => {
      renderForm({ queryToken: TOKEN });

      expect(screen.getByText('login.hintEmailLogin')).toBeTruthy();
      expect(screen.getByTestId('guest-login').textContent).toBe('default guest label');
      expect(screen.getByText('login.hintGuestLogin')).toBeTruthy();
    });

    it('offers only the login without the token, without hints', () => {
      renderForm();

      expect(screen.queryByTestId('guest-login')).toBeNull();
      expect(screen.queryByText('login.hintEmailLogin')).toBeNull();
    });
  });

  describe('for a PPR request', () => {
    it('tells what the login gives for the request', () => {
      const { container } = renderForm({ ppr: true });

      expect(container.querySelector('[data-cy="login-form"]')).not.toBeNull();
      expect(screen.getByText('ppr.login.emailHint')).toBeTruthy();
      expect(screen.queryByText('login.hintEmailLogin')).toBeNull();
      expect(screen.queryByTestId('guest-login')).toBeNull();
    });

    it('offers to continue as guest where the link carries the guest access token', () => {
      renderForm({ ppr: true, queryToken: TOKEN });

      expect(screen.getByText('ppr.login.emailHint')).toBeTruthy();
      expect(screen.getByTestId('guest-login').textContent).toBe('ppr.login.continueAsGuest');
      expect(screen.getByText('ppr.login.guestHint')).toBeTruthy();
      expect(screen.queryByText('login.hintGuestLogin')).toBeNull();
    });

    it('offers only to continue as guest with the link of the guest access only', () => {
      const { container } = renderForm({ ppr: true, queryToken: TOKEN, guestOnly: true });

      expect(container.querySelector('[data-cy="login-form"]')).toBeNull();
      expect(screen.queryByText('ppr.login.emailHint')).toBeNull();
      expect(screen.getByTestId('guest-login').textContent).toBe('ppr.login.continueAsGuest');
    });
  });
});
