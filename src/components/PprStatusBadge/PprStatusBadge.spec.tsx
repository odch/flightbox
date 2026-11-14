import React from 'react';
import { renderWithTheme, screen } from '../../../test/renderWithTheme';
import PprStatusBadge from './PprStatusBadge';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('PprStatusBadge', () => {
  it('shows the status', () => {
    renderWithTheme(<PprStatusBadge status="approved"/>);
    expect(screen.getByText('ppr.status.approved')).toBeTruthy();
  });

  it.each([
    ['pending', 'rgb(51, 51, 51)', 'rgb(255, 193, 7)'],
    ['approved', 'rgb(255, 255, 255)', 'rgb(40, 167, 69)'],
    ['rejected', 'rgb(255, 255, 255)', 'rgb(220, 53, 69)'],
    ['revoked', 'rgb(255, 255, 255)', 'rgb(108, 117, 125)'],
  ])('shows %s in its colours, dark text on the yellow', (status, color, background) => {
    renderWithTheme(<PprStatusBadge status={status}/>);
    const badge = screen.getByText(`ppr.status.${status}`);
    expect(badge).toHaveStyle(`color: ${color}`);
    expect(badge).toHaveStyle(`background-color: ${background}`);
  });

  // The app font sits high in its line box
  it('has more padding above the text than below, to put it in the middle', () => {
    renderWithTheme(<PprStatusBadge status="pending"/>);
    const style = getComputedStyle(screen.getByText('ppr.status.pending'));
    expect(parseFloat(style.paddingTop)).toBeGreaterThan(parseFloat(style.paddingBottom));
    expect(style.lineHeight).toBe('1');
  });
});
