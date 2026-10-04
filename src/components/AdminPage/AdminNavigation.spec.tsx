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

  it('hides the API access tab', () => {
    renderWithTheme(<AdminNavigation activeTab="export" hiddenTabs={['api-access']} onTabChange={jest.fn()}/>);
    expect(screen.queryByRole('button', {name: /API-Zugriff/})).toBeNull();
    expect(screen.getByRole('button', {name: /Export/})).toBeInTheDocument();
  });
});
