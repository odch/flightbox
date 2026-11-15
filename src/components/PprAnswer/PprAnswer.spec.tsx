import React from 'react';
import { renderWithTheme, screen } from '../../../test/renderWithTheme';
import PprAnswer from './PprAnswer';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('PprAnswer', () => {
  it('shows the information for pilots of an approval, in green', () => {
    renderWithTheme(<PprAnswer status="approved" remarks="Runway 05/23" dataCy="answer"/>);

    const box = screen.getByText('Runway 05/23', { exact: false });
    expect(box).toHaveTextContent('ppr.pilotInfoRunway 05/23');
    expect(box).toHaveAttribute('data-cy', 'answer');
    expect(box).toHaveStyle('border-left: 3px solid #28a745');
  });

  it('shows the remark of an approval by an admin as such, as the email does', () => {
    renderWithTheme(<PprAnswer status="approved" remarks="Nur Piste 36" automatic={false}/>);
    expect(screen.getByText('Nur Piste 36', { exact: false })).toHaveTextContent('ppr.approvalRemarksNur Piste 36');
  });

  it.each([false, true])('shows the reason of a rejection answered automatically: %p', automatic => {
    renderWithTheme(<PprAnswer status="rejected" remarks="Geschlossen" automatic={automatic}/>);
    expect(screen.getByText('Geschlossen', { exact: false })).toHaveTextContent('ppr.reasonGeschlossen');
  });

  it.each(['rejected', 'revoked'])('shows the reason of a %s request, in red', status => {
    renderWithTheme(<PprAnswer status={status} remarks="Runway works"/>);

    const box = screen.getByText('Runway works', { exact: false });
    expect(box).toHaveTextContent('ppr.reasonRunway works');
    expect(box).toHaveStyle('border-left: 3px solid #dc3545');
  });

  it('keeps the line breaks of the answer', () => {
    renderWithTheme(<PprAnswer status="approved" remarks={'Runway 05/23\nFee CHF 20'}/>);
    expect(screen.getByText('Runway 05/23', { exact: false })).toHaveStyle('white-space: pre-line');
  });
});
