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

  it('shows the PPR entries to logins with an email when PPR is enabled', () => {
    (global as any).__CONF__ = { ppr: true };
    renderWithTheme(<EntryPoints email="pilot@example.com"/>);
    expect(screen.queryByText('nav.ppr')).not.toBeNull();
    expect(screen.queryByText('nav.pprList')).not.toBeNull();
  });

  it('hides the PPR entries from logins without an email (username/password)', () => {
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

  it('hides the PPR entries from guests', () => {
    (global as any).__CONF__ = { ppr: true };
    renderWithTheme(<EntryPoints guest email="guest@example.com"/>);
    expect(screen.queryByText('nav.ppr')).toBeNull();
  });
});
