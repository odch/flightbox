import React from 'react';
import { renderWithTheme, screen } from '../../../test/renderWithTheme';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

jest.mock('../MaterialIcon', () => {
  const React = require('react');
  return function MockMaterialIcon({ icon }) {
    return <span data-testid="material-icon" data-icon={icon} />;
  };
});

import EntryPoints from './EntryPoints';

describe('EntryPoints', () => {
  afterEach(() => {
    delete (global as any).__CONF__;
  });

  const tier = (container: HTMLElement, name: string) =>
    container.querySelector(`[data-cy="entry-points-${name}"]`) as HTMLElement | null;
  const entriesIn = (container: HTMLElement, name: string) =>
    Array.from(tier(container, name)?.querySelectorAll('a') || []).map(a => a.getAttribute('data-cy'));

  describe('tiers', () => {
    it('shows recording movements first, then the PPR requests and the administration, then feedback and help', () => {
      (global as any).__CONF__ = { ppr: true };
      const { container } = renderWithTheme(<EntryPoints admin email="admin@example.com"/>);

      expect(entriesIn(container, 'primary')).toEqual(['new-departure', 'new-arrival', 'movements']);
      expect(entriesIn(container, 'secondary')).toEqual(['new-ppr', 'ppr-list', 'admin']);
      expect(entriesIn(container, 'tertiary')).toEqual(['message', 'help']);
    });

    it('shows only the administration in the middle without PPR', () => {
      (global as any).__CONF__ = { ppr: false };
      const { container } = renderWithTheme(<EntryPoints admin email="admin@example.com"/>);
      expect(entriesIn(container, 'secondary')).toEqual(['admin']);
    });

    it('leaves the middle out for pilots without PPR', () => {
      (global as any).__CONF__ = { ppr: false };
      const { container } = renderWithTheme(<EntryPoints email="pilot@example.com"/>);
      expect(tier(container, 'secondary')).toBeNull();
      expect(entriesIn(container, 'primary')).toEqual(['new-departure', 'new-arrival', 'movements']);
    });

    it.each([['guests', { guest: true }], ['the kiosk', { kiosk: true }]])(
      'offers %s recording their movements and the help only, where requests without login are off',
      (_, props) => {
        (global as any).__CONF__ = { ppr: true };
        const { container } = renderWithTheme(<EntryPoints {...props} admin email="x@example.com"/>);

        expect(entriesIn(container, 'primary')).toEqual(['new-departure', 'new-arrival']);
        expect(tier(container, 'secondary')).toBeNull();
        expect(entriesIn(container, 'tertiary')).toEqual(['help']);
      }
    );

    it('links to the pages', () => {
      (global as any).__CONF__ = { ppr: true };
      renderWithTheme(<EntryPoints admin email="admin@example.com"/>);
      const hrefs = screen.getAllByRole('link').map(a => a.getAttribute('href'));
      expect(hrefs).toEqual(['/departure/new', '/arrival/new', '/movements', '/ppr/new', '/ppr', '/admin', '/message', '/help']);
    });

    it('names the entries by their labels only, without the words of the icon font', () => {
      (global as any).__CONF__ = { ppr: true };
      const { container } = renderWithTheme(<EntryPoints admin email="admin@example.com"/>);
      screen.getAllByTestId('material-icon').forEach(icon =>
        expect(icon.closest('[aria-hidden="true"]')).not.toBeNull());
      expect(screen.getByRole('link', { name: 'nav.ppr' })).toBeTruthy();
      const images = Array.from(container.querySelectorAll('img'));
      expect(images).toHaveLength(3);
      images.forEach(img => expect(img).toHaveAttribute('alt', ''));
    });
  });

  it('shows the PPR entries to logins with an email when PPR is enabled', () => {
    (global as any).__CONF__ = { ppr: true };
    renderWithTheme(<EntryPoints email="pilot@example.com"/>);
    expect(screen.queryByText('nav.ppr')).not.toBeNull();
    expect(screen.queryByText('nav.pprList')).not.toBeNull();
  });

  it('hides the PPR entries from logins without an email (username/password) where requests without login are off', () => {
    (global as any).__CONF__ = { ppr: true };
    renderWithTheme(<EntryPoints email={null}/>);
    expect(screen.queryByText('nav.ppr')).toBeNull();
    expect(screen.queryByText('nav.pprList')).toBeNull();
  });

  it('hides the PPR entries when PPR is disabled', () => {
    (global as any).__CONF__ = { ppr: false };
    renderWithTheme(<EntryPoints email="pilot@example.com"/>);
    expect(screen.queryByText('nav.ppr')).toBeNull();
  });

  it('hides the PPR entries from guests where requests without login are off', () => {
    (global as any).__CONF__ = { ppr: true };
    renderWithTheme(<EntryPoints guest email="guest@example.com"/>);
    expect(screen.queryByText('nav.ppr')).toBeNull();
  });

  describe('with requests without login', () => {
    beforeEach(() => {
      (global as any).__CONF__ = { ppr: true, pprGuestRequests: true };
    });

    it.each([
      ['guests', { guest: true }],
      ['logins without an email (username/password)', { email: null }],
    ])('offers %s the PPR request, but no list of their own', (_, props) => {
      const { container } = renderWithTheme(<EntryPoints {...props}/>);

      expect(entriesIn(container, 'secondary')).toEqual(['new-ppr']);
      expect(screen.getByRole('link', { name: 'nav.ppr' })).toHaveAttribute('href', '/ppr/new');
      expect(screen.queryByText('nav.pprList')).toBeNull();
    });

    it('still offers the kiosk recording its movements and the help only', () => {
      const { container } = renderWithTheme(<EntryPoints kiosk/>);

      expect(tier(container, 'secondary')).toBeNull();
      expect(entriesIn(container, 'tertiary')).toEqual(['help']);
    });

    it('offers logins with an email both PPR entries, as before', () => {
      const { container } = renderWithTheme(<EntryPoints email="pilot@example.com"/>);
      expect(entriesIn(container, 'secondary')).toEqual(['new-ppr', 'ppr-list']);
    });
  });
});
