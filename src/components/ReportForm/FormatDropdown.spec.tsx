import React from 'react';
import { renderWithTheme, screen, fireEvent } from '../../../test/renderWithTheme';
import FormatDropdown from './FormatDropdown';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
  withTranslation: () => Component => Component,
}));

jest.mock('scroll-into-view', () => jest.fn());

describe('FormatDropdown', () => {
  it('renders an input element', () => {
    renderWithTheme(<FormatDropdown onChange={jest.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('offers the pdf and excel options when focused', () => {
    renderWithTheme(<FormatDropdown onChange={jest.fn()} />);
    fireEvent.focus(screen.getByRole('textbox'));
    expect(screen.getByText('invoicesReport.formatPdf')).toBeInTheDocument();
    expect(screen.getByText('invoicesReport.formatExcel')).toBeInTheDocument();
  });

  it('calls onChange with the selected format key', () => {
    const onChange = jest.fn();
    renderWithTheme(<FormatDropdown onChange={onChange} />);
    fireEvent.focus(screen.getByRole('textbox'));
    fireEvent.mouseDown(screen.getByText('invoicesReport.formatExcel'));
    expect(onChange).toHaveBeenCalledWith('excel');
  });

  it('renders the current value', () => {
    renderWithTheme(<FormatDropdown value="excel" onChange={jest.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('invoicesReport.formatExcel');
  });

  it('does not throw when no onChange is given', () => {
    renderWithTheme(<FormatDropdown />);
    fireEvent.focus(screen.getByRole('textbox'));
    expect(() =>
      fireEvent.mouseDown(screen.getByText('invoicesReport.formatPdf'))
    ).not.toThrow();
  });
});
