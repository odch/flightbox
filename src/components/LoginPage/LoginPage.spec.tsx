import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: object) => options ? `${key}:${JSON.stringify(options)}` : key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

jest.mock('../MaterialIcon', () => () => null);
jest.mock('../Logo', () => () => <img alt="logo"/>);
jest.mock('../LanguageSwitch', () => () => <div/>);
jest.mock('../../containers/EmailLoginFormContainer', () => ({ queryToken, ppr }: any) => (
  <div data-testid="email-login" data-query-token={queryToken || ''} data-ppr={String(!!ppr)}/>
));
jest.mock('../AerodromeStatusBanner', () => () => <div data-testid="aerodrome-status"/>);
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
    (global as any).__CONF__ = { ppr: true, pprGuestRequests: true, loginForm: 'email', aerodrome: { name: 'Langenthal' } };
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

  describe('the login of a PPR request (/ppr/new, e.g. from the website link)', () => {
    const TEXT = 'ppr.login.text:{"aerodrome":"Langenthal"}';

    it('names the aerodrome and what PPR is, with its status, and has the login offer what it gives for PPR', () => {
      renderAt('/ppr/new');

      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('ppr.requestFor:{"aerodrome":"Langenthal"}');
      expect(screen.getByText(TEXT)).toBeTruthy();
      expect(screen.getByTestId('aerodrome-status')).toBeTruthy();
      expect(screen.getByTestId('email-login')).toHaveAttribute('data-ppr', 'true');
    });

    // The guest session needs the token of the guest access, in the fragment
    // of the website link with the guest access
    it('hands on the guest access token of the link', () => {
      const token = '0f8fad5b-d9cb-469f-a165-70867728950e';
      renderAt(`/ppr/new?t=${token}`);
      expect(screen.getByTestId('email-login')).toHaveAttribute('data-query-token', token);
    });

    // A guest session would land on the start page, without PPR
    it('offers no guest session where requests without login are off', () => {
      (global as any).__CONF__.pprGuestRequests = false;
      renderAt('/ppr/new?t=0f8fad5b-d9cb-469f-a165-70867728950e');
      expect(screen.getByTestId('email-login')).toHaveAttribute('data-query-token', '');
    });

    it('keeps the guest access for the movements on other pages, whatever the PPR flags', () => {
      (global as any).__CONF__.pprGuestRequests = false;
      renderAt('/?t=0f8fad5b-d9cb-469f-a165-70867728950e');
      expect(screen.getByTestId('email-login')).toHaveAttribute('data-query-token', '0f8fad5b-d9cb-469f-a165-70867728950e');
    });

    it('is the PPR login with a trailing slash, as for the routes', () => {
      renderAt('/ppr/new/');
      expect(screen.getByText(TEXT)).toBeTruthy();
    });

    it.each(['/', '/ppr', '/ppr/login', '/admin'])('says nothing about PPR at %s', path => {
      renderAt(path);
      expect(screen.queryByText(TEXT)).toBeNull();
      expect(screen.queryByTestId('aerodrome-status')).toBeNull();
      expect(screen.getByTestId('email-login')).toHaveAttribute('data-ppr', 'false');
    });

    it('says nothing about PPR where PPR is off', () => {
      (global as any).__CONF__.ppr = false;
      renderAt('/ppr/new');
      expect(screen.queryByText(TEXT)).toBeNull();
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
