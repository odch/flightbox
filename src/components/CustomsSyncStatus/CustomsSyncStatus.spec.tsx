import React from 'react';
import i18n from '../../i18n';
import {renderWithTheme, screen} from '../../../test/renderWithTheme';
import CustomsSyncStatus from './CustomsSyncStatus';

// 14:34 in Zurich (CEST)
const TIMESTAMP = '2026-10-05T12:34:56.000Z';

describe('components', () => {
  describe('CustomsSyncStatus', () => {
    it.each([
      ['no status', undefined],
      ['a null status', null],
      ['an unknown status', {status: 'pending', timestamp: TIMESTAMP}],
      ['a status without timestamp', {status: 'ok'}],
      ['a status with an invalid timestamp', {status: 'ok', timestamp: 'yesterday'}],
    ])('renders nothing for %s', (_, status) => {
      const {container} = renderWithTheme(<CustomsSyncStatus status={status as any}/>);
      expect(container).toBeEmptyDOMElement();
    });

    it('shows when the list was last synchronised', () => {
      renderWithTheme(<CustomsSyncStatus status={{status: 'ok', timestamp: TIMESTAMP}}/>);

      expect(screen.getByRole('status')).toContainElement(
        screen.getByText('Zuletzt mit der Zollanmeldungs-App synchronisiert: 05.10.2026 14:34')
      );
      expect(screen.queryByText(/abgelehnt/)).toBeNull();
    });

    it('lists the entries the customs app rejected', () => {
      renderWithTheme(
        <CustomsSyncStatus status={{status: 'ok', timestamp: TIMESTAMP, rejected: ['bad@', 'worse@']}}/>
      );

      expect(screen.getByText('Folgende Einträge wurden von der Zollanmeldungs-App abgelehnt:')).toBeInTheDocument();
      const items = screen.getAllByRole('listitem');
      expect(items.map(item => item.textContent)).toEqual(['bad@', 'worse@']);
    });

    it('shows a generic message without details when the synchronisation failed', () => {
      renderWithTheme(
        <CustomsSyncStatus status={{status: 'error', timestamp: TIMESTAMP, httpStatus: 401}}/>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toContainElement(screen.getByText(
        'Synchronisation mit der Zollanmeldungs-App fehlgeschlagen (05.10.2026 14:34). ' +
        'Bitte später erneut versuchen oder den Support kontaktieren.'
      ));
      expect(alert).not.toHaveTextContent('401');
    });

    it('does not list rejected entries of a failed synchronisation', () => {
      renderWithTheme(
        <CustomsSyncStatus status={{status: 'error', timestamp: TIMESTAMP, rejected: ['bad@']}}/>
      );

      expect(screen.queryByRole('listitem')).toBeNull();
    });

    it('is translated to English', async () => {
      await i18n.changeLanguage('en');
      try {
        const {unmount} = renderWithTheme(<CustomsSyncStatus status={{status: 'ok', timestamp: TIMESTAMP}}/>);

        expect(screen.getByText('Last synchronised with the customs declaration app: 10/05/2026 2:34 PM')).toBeInTheDocument();
        unmount();
      } finally {
        await i18n.changeLanguage('de');
      }
    });
  });
});
