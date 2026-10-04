import React from 'react';
import '../../i18n';
import {renderWithTheme, screen, within} from '../../../test/renderWithTheme';
import UsageHint from './UsageHint';

describe('UsageHint', () => {
  // jsdom serves the page from http://localhost; in the app this is the
  // domain the admin uses, e.g. https://lsze.flightbox.aero.
  const base = 'http://localhost/api/v1';

  it('shows the API on the app domain and how to send the key', () => {
    renderWithTheme(<UsageHint/>);
    expect(screen.getByTestId('api-base-url')).toHaveTextContent(base);
    expect(screen.getByText(/im Header 'Authorization: Bearer <Schlüssel>' mitgeschickt, nie in der URL/)).toBeInTheDocument();
    expect(screen.getByText(/100 Anfragen pro Tag \(UTC\); dabei zählt jede Anfrage mit gültigem Schlüssel/)).toBeInTheDocument();
  });

  it('documents the airstat report with its parameters and a curl example', () => {
    renderWithTheme(<UsageHint/>);
    expect(screen.getByTestId('api-endpoint')).toHaveTextContent(`${base}/reports/airstat`);
    ['year', 'month', 'internal', 'delimiter'].forEach(param => {
      expect(screen.getByText(param, {selector: 'dt'})).toBeInTheDocument();
    });
    expect(screen.getByText(/mit der Berechtigung 'Airstat-Report \(BAZL\)'/)).toBeInTheDocument();
    expect(screen.getByText(/zusätzlich die Berechtigung 'Airstat-Report mit zusätzlichen Informationen/)).toBeInTheDocument();
    const curl = screen.getByTestId('api-curl-example').textContent;
    expect(curl).toContain('-H "Authorization: Bearer IHR_API_SCHLUESSEL"');
    expect(curl).toContain(`"${base}/reports/airstat?year=2026&month=9&internal=false&delimiter=semicolon"`);
  });

  it('documents the public aerodrome status without a key', () => {
    renderWithTheme(<UsageHint/>);
    expect(screen.getByRole('heading', {name: 'Flugplatzstatus'})).toBeInTheDocument();
    expect(screen.getByTestId('api-status-endpoint')).toHaveTextContent(`${base}/aerodrome/status`);
    const curl = screen.getByTestId('api-status-curl-example').textContent;
    expect(curl).toBe(`curl "${base}/aerodrome/status"`);
    expect(curl).not.toContain('Authorization');
    expect(screen.getByText(/last_update_user mit Name und E-Mail-Adresse/)).toBeInTheDocument();
  });

  it('lists the error answers of the API', () => {
    renderWithTheme(<UsageHint/>);
    const errors = within(screen.getByTestId('api-errors'));
    ['400', '401', '403', '429', '500'].forEach(status => {
      expect(errors.getByText(status)).toBeInTheDocument();
    });
    expect(errors.getByText(/invalid_request/)).toBeInTheDocument();
    expect(errors.getByText(/credentials_in_url/)).toBeInTheDocument();
    expect(errors.getByText(/nur der Text 'Unauthorized'/)).toBeInTheDocument();
    expect(errors.getByText(/invalid_movement_data/)).toBeInTheDocument();
    expect(errors.getByText(/key_expired/)).toBeInTheDocument();
    expect(errors.getByText(/insufficient_scope/)).toBeInTheDocument();
    expect(errors.getByText(/Retry-After/)).toBeInTheDocument();
  });
});
