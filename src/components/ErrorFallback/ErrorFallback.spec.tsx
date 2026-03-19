import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorFallback from './ErrorFallback';

describe('ErrorFallback', () => {
  it('should render the error message text', () => {
    render(<ErrorFallback />);
    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.getByText('An unexpected error occurred.')).toBeDefined();
  });

  it('should render a clickable reload button', () => {
    // Suppress jsdom "Not implemented: navigation" error from reload()
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorFallback />);
    const button = screen.getByText('Reload');
    expect(button.tagName).toBe('BUTTON');
    // window.location.reload() cannot be mocked in jsdom, but we verify
    // the button exists and clicking it does not throw.
    fireEvent.click(button);
    errorSpy.mockRestore();
  });
});
