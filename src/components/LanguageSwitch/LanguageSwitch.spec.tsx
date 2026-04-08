import React from 'react';
import { renderWithTheme, screen, fireEvent } from '../../../test/renderWithTheme';

const mockChangeLanguage = jest.fn();
let mockLanguage = 'de';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: mockLanguage,
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

import LanguageSwitch from './LanguageSwitch';

describe('LanguageSwitch', () => {
  beforeEach(() => {
    mockLanguage = 'de';
    mockChangeLanguage.mockClear();
  });

  it('renders DE and EN buttons', () => {
    renderWithTheme(<LanguageSwitch />);
    expect(screen.getByText('DE')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('calls changeLanguage when inactive button is clicked', () => {
    renderWithTheme(<LanguageSwitch />);
    fireEvent.click(screen.getByText('EN'));
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
  });

  it('calls changeLanguage with de when DE is clicked while on EN', () => {
    mockLanguage = 'en';
    renderWithTheme(<LanguageSwitch />);
    fireEvent.click(screen.getByText('DE'));
    expect(mockChangeLanguage).toHaveBeenCalledWith('de');
  });

  it('has correct aria-labels', () => {
    renderWithTheme(<LanguageSwitch />);
    expect(screen.getByLabelText('Deutsch')).toBeInTheDocument();
    expect(screen.getByLabelText('English')).toBeInTheDocument();
  });
});
