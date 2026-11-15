import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

jest.mock('../MaterialIcon', () => () => null);
jest.mock('../Logo', () => () => <img alt="logo"/>);
jest.mock('../LanguageSwitch', () => () => <div/>);
jest.mock('../../containers/EmailLoginFormContainer', () => () => <div data-testid="email-login"/>);
jest.mock('../../containers/UsernamePasswordLoginFormContainer', () => () => <div data-testid="password-login"/>);

import LoginPage from './LoginPage';

const theme: any = {
  colors: { main: '#003863', background: '#fafafa', danger: '#e00f00' },
};

const renderAt = (path: string, props = {}) => render(
  <ThemeProvider theme={theme}>
    <MemoryRouter initialEntries={[path]}>
      <LoginPage {...props}/>
    </MemoryRouter>
  </ThemeProvider>
);

describe('LoginPage', () => {
  beforeEach(() => {
    (global as any).__CONF__ = { ppr: true, loginForm: 'email', aerodrome: { name: 'Langenthal' } };
  });

  afterEach(() => {
    delete (global as any).__CONF__;
  });

  it('shows the aerodrome and the email login of the project', () => {
    renderAt('/');

    expect(screen.getByText('Langenthal')).toBeTruthy();
    expect(screen.getByTestId('email-login')).toBeTruthy();
    expect(screen.queryByTestId('password-login')).toBeNull();
  });

  it('shows the username/password login of a project without email login', () => {
    (global as any).__CONF__.loginForm = 'usernamePassword';
    renderAt('/');

    expect(screen.getByTestId('password-login')).toBeTruthy();
    expect(screen.queryByTestId('email-login')).toBeNull();
  });

  describe('the PPR login (/ppr/login)', () => {
    it('tells that the PPR request follows, with a way back to the intro', () => {
      renderAt('/ppr/login');

      expect(screen.getByText('ppr.login.context')).toBeTruthy();
      expect(screen.getByRole('link', { name: 'ppr.login.back' })).toHaveAttribute('href', '/ppr/new');
      expect(screen.getByTestId('email-login')).toBeTruthy();
    });

    it('is the PPR login with a trailing slash, as for the routes', () => {
      renderAt('/ppr/login/');
      expect(screen.getByText('ppr.login.context')).toBeTruthy();
    });

    it.each(['/', '/ppr', '/ppr/new', '/admin'])('says nothing about PPR at %s', path => {
      renderAt(path);
      expect(screen.queryByText('ppr.login.context')).toBeNull();
      expect(screen.queryByRole('link', { name: 'ppr.login.back' })).toBeNull();
    });

    it('says nothing about PPR where PPR is off', () => {
      (global as any).__CONF__.ppr = false;
      renderAt('/ppr/login');
      expect(screen.queryByText('ppr.login.context')).toBeNull();
    });
  });

  describe('privacy', () => {
    it('asks to accept the privacy policy with the login', () => {
      renderAt('/', { privacyPolicyUrl: 'https://aerodrome.ch/privacy', emailSent: false });
      expect(screen.getByText('legal.privacyConsent')).toBeTruthy();
    });

    it('no longer asks once the code was sent', () => {
      renderAt('/', { privacyPolicyUrl: 'https://aerodrome.ch/privacy', emailSent: true });
      expect(screen.queryByText('legal.privacyConsent')).toBeNull();
    });

    it('does not ask without a link to a web page', () => {
      renderAt('/', { privacyPolicyUrl: 'javascript:alert(1)' });
      expect(screen.queryByText('legal.privacyConsent')).toBeNull();
    });
  });
});
