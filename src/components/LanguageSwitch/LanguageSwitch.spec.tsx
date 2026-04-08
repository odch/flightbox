import React from 'react';
import { renderWithTheme, screen, fireEvent } from '../../../test/renderWithTheme';

const mockChangeLanguage = jest.fn();
const mockDispatch = jest.fn();
let mockLanguage = 'de';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: mockLanguage,
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

import LanguageSwitch from './LanguageSwitch';

describe('LanguageSwitch', () => {
  beforeEach(() => {
    mockLanguage = 'de';
    mockChangeLanguage.mockClear();
    mockDispatch.mockClear();
  });

  it('renders DE and EN buttons', () => {
    renderWithTheme(<LanguageSwitch />);
    expect(screen.getByText('DE')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('calls changeLanguage and dispatches saveLanguage when clicked', () => {
    renderWithTheme(<LanguageSwitch />);
    fireEvent.click(screen.getByText('EN'));
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SAVE_LANGUAGE',
      payload: { language: 'en' },
    });
  });

  it('switches back to German', () => {
    mockLanguage = 'en';
    renderWithTheme(<LanguageSwitch />);
    fireEvent.click(screen.getByText('DE'));
    expect(mockChangeLanguage).toHaveBeenCalledWith('de');
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SAVE_LANGUAGE',
      payload: { language: 'de' },
    });
  });

  it('has correct aria-labels', () => {
    renderWithTheme(<LanguageSwitch />);
    expect(screen.getByLabelText('Deutsch')).toBeInTheDocument();
    expect(screen.getByLabelText('English')).toBeInTheDocument();
  });
});
