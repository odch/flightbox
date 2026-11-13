import React from 'react';
import '../../i18n';
import {renderWithTheme, screen, fireEvent} from '../../../test/renderWithTheme';
import AdminNavigation from './AdminNavigation';

describe('AdminNavigation', () => {
  it('shows the API access tab when it is not hidden', () => {
    const onTabChange = jest.fn();
    renderWithTheme(<AdminNavigation activeTab="export" hiddenTabs={[]} onTabChange={onTabChange}/>);

    const tab = screen.getByRole('button', {name: /API-Zugriff/});
    expect(tab).toHaveAttribute('data-cy', 'api-access');

    fireEvent.click(tab);
    expect(onTabChange).toHaveBeenCalledWith('api-access');
  });

  it('shows the customs self-declaration tab when it is not hidden', () => {
    const onTabChange = jest.fn();
    renderWithTheme(<AdminNavigation activeTab="export" hiddenTabs={[]} onTabChange={onTabChange}/>);

    const tab = screen.getByRole('button', {name: /Zoll-Selbstdeklaration/});
    expect(tab).toHaveAttribute('data-cy', 'customs-self-declaration');

    fireEvent.click(tab);
    expect(onTabChange).toHaveBeenCalledWith('customs-self-declaration');
  });

  it('hides the customs self-declaration tab', () => {
    renderWithTheme(<AdminNavigation activeTab="export" hiddenTabs={['customs-self-declaration']} onTabChange={jest.fn()}/>);
    expect(screen.queryByRole('button', {name: /Zoll-Selbstdeklaration/})).toBeNull();
  });

  it('shows the number of open items on a tab', () => {
    renderWithTheme(<AdminNavigation activeTab="export" hiddenTabs={[]} onTabChange={jest.fn()} counts={{ppr: 3}}/>);

    const count = screen.getByTitle('Offene Anfragen: 3');
    expect(count).toHaveTextContent('3');
    expect(screen.getByRole('button', {name: /PPR-Anfragen/})).toContainElement(count);
  });

  it.each([0, null, undefined])('shows no number for %p open items', count => {
    const {container} = renderWithTheme(
      <AdminNavigation activeTab="export" hiddenTabs={[]} onTabChange={jest.fn()} counts={{ppr: count}}/>
    );
    expect(container.querySelector('[data-cy="ppr-count"]')).toBeNull();
  });

  it('hides the API access tab', () => {
    renderWithTheme(<AdminNavigation activeTab="export" hiddenTabs={['api-access']} onTabChange={jest.fn()}/>);
    expect(screen.queryByRole('button', {name: /API-Zugriff/})).toBeNull();
    expect(screen.getByRole('button', {name: /Export/})).toBeInTheDocument();
  });
});
