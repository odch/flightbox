import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: object) => options ? `${key}:${JSON.stringify(options)}` : key }),
}));

jest.mock('../MaterialIcon', () => {
  const React = require('react');
  return function MockMaterialIcon({ icon }) {
    return <span data-testid="material-icon" data-icon={icon}/>;
  };
});
jest.mock('../Logo', () => () => <img alt="logo"/>);
jest.mock('../LanguageSwitch', () => () => <div/>);
// The connected banner, which shows the public aerodrome status
jest.mock('../AerodromeStatusBanner', () => ({ className }) => <div data-testid="status-banner" className={className}/>);

import PprIntroPage from './PprIntroPage';

const theme: any = {
  colors: { main: '#003863', background: '#fafafa', danger: '#e00f00' },
};

const renderIntro = (privacyPolicyUrl: string | null = null) => render(
  <ThemeProvider theme={theme}>
    <MemoryRouter initialEntries={['/ppr/new']}>
      <PprIntroPage privacyPolicyUrl={privacyPolicyUrl}/>
    </MemoryRouter>
  </ThemeProvider>
);

const choices = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-cy^="ppr-with"]')).map(a => [a.getAttribute('data-cy'), a.getAttribute('href')]);

describe('PprIntroPage', () => {
  beforeEach(() => {
    (global as any).__CONF__ = {
      ppr: true,
      pprGuestRequests: true,
      loginForm: 'email',
      aerodrome: { name: 'Langenthal' },
    };
  });

  afterEach(() => {
    delete (global as any).__CONF__;
  });

  it('names the aerodrome and tells what happens with the request', () => {
    renderIntro();

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('ppr.requestFor:{"aerodrome":"Langenthal"}');
    expect(screen.getByText('ppr.intro.text:{"aerodrome":"Langenthal"}')).toBeTruthy();
    // in the header beside the content, as on the login page
    expect(screen.getByText('Langenthal')).toBeTruthy();
  });

  it('shows the aerodrome status', () => {
    renderIntro();
    expect(screen.getByTestId('status-banner')).toBeTruthy();
  });

  it('offers the login and the way without login', () => {
    const { container } = renderIntro();

    expect(choices(container)).toEqual([['ppr-with-login', '/ppr/login'], ['ppr-without-login', '/ppr/guest']]);
    expect(screen.getByText('ppr.intro.withLogin')).toBeTruthy();
    expect(screen.getByText('ppr.intro.withLoginHelp')).toBeTruthy();
    expect(screen.getByText('ppr.intro.withoutLogin')).toBeTruthy();
    expect(screen.getByText('ppr.intro.withoutLoginHelp')).toBeTruthy();
  });

  it('offers only the login where requests without login are off', () => {
    (global as any).__CONF__.pprGuestRequests = false;
    const { container } = renderIntro();

    expect(choices(container)).toEqual([['ppr-with-login', '/ppr/login']]);
  });

  it('offers only the way without login where the login gives no email address', () => {
    (global as any).__CONF__.loginForm = 'usernamePassword';
    const { container } = renderIntro();

    expect(choices(container)).toEqual([['ppr-without-login', '/ppr/guest']]);
  });

  it('keeps the words of the icon font from screen readers', () => {
    renderIntro();
    const icons = screen.getAllByTestId('material-icon');
    expect(icons).toHaveLength(2);
    icons.forEach(icon => expect(icon.closest('[aria-hidden="true"]')).not.toBeNull());
  });

  it('links the privacy policy of the aerodrome', () => {
    renderIntro('https://aerodrome.ch/privacy');

    const link = screen.getByRole('link', { name: 'legal.privacyPolicy' });
    expect(link).toHaveAttribute('href', 'https://aerodrome.ch/privacy');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('links no privacy policy without one', () => {
    renderIntro(null);
    expect(screen.queryByText('legal.privacyPolicy')).toBeNull();
  });
});
