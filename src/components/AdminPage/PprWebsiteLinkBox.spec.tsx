import React from 'react';
import { renderWithTheme, screen, fireEvent, act } from '../../../test/renderWithTheme';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import PprWebsiteLinkBox from './PprWebsiteLinkBox';

describe('PprWebsiteLinkBox', () => {
  beforeEach(() => {
    (global as any).__CONF__ = { appUrl: 'https://lspl-test.web.app' };
  });

  afterEach(() => {
    delete (global as any).__CONF__;
  });

  const link = () => screen.getByText(/\/ppr$/);

  it('links to the short link of PPR requests on the address of the app', () => {
    renderWithTheme(<PprWebsiteLinkBox/>);

    expect(screen.getByText('ppr.websiteLink.title')).toBeTruthy();
    expect(link().textContent).toBe('https://lspl-test.web.app/ppr');
    expect(link()).toHaveAttribute('href', 'https://lspl-test.web.app/ppr');
    expect(link()).toHaveAttribute('target', '_blank');
  });

  it('ignores a slash at the end of the address of the app', () => {
    (global as any).__CONF__ = { appUrl: 'https://lspl-test.web.app/' };
    renderWithTheme(<PprWebsiteLinkBox/>);
    expect(link().textContent).toBe('https://lspl-test.web.app/ppr');
  });

  it('takes the address of the page where the project sets none', () => {
    (global as any).__CONF__ = {};
    renderWithTheme(<PprWebsiteLinkBox/>);
    expect(link().textContent).toBe(`${window.location.origin}/ppr`);
  });

  it('copies the link', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderWithTheme(<PprWebsiteLinkBox/>);

    await act(async () => {
      fireEvent.click(screen.getByTitle('Copy to Clipboard'));
    });

    expect(writeText).toHaveBeenCalledWith('https://lspl-test.web.app/ppr');
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });

  it('offers a QR code of the link for printed notices', () => {
    const { container } = renderWithTheme(<PprWebsiteLinkBox/>);

    expect(container.querySelector('svg')).not.toBeNull();
    expect(screen.getByText('common.download')).toBeTruthy();
  });

  it('tells admins that they see the form themselves, and how to see what visitors see', () => {
    renderWithTheme(<PprWebsiteLinkBox/>);
    expect(screen.getByText('ppr.websiteLink.ownView')).toBeTruthy();
  });
});
