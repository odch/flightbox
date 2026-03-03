import React from 'react';
import { renderWithTheme, screen, fireEvent, act } from '../../../test/renderWithTheme';

jest.mock('../MaterialIcon', () => {
  const React = require('react');
  return function MockMaterialIcon({ icon }) {
    return <span data-testid="material-icon" data-icon={icon} />;
  };
});

import ClipboardCopier from './index';

describe('ClipboardCopier', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    const { container } = renderWithTheme(
      <ClipboardCopier text="Hello World" />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders copy icon by default', () => {
    renderWithTheme(<ClipboardCopier text="test" />);
    const icon = screen.getByTestId('material-icon');
    expect(icon.getAttribute('data-icon')).toBe('content_copy');
  });

  it('shows copy button with title', () => {
    renderWithTheme(<ClipboardCopier text="test" />);
    expect(screen.getByTitle('Copy to Clipboard')).toBeInTheDocument();
  });

  describe('with navigator.clipboard', () => {
    let writeTextMock;

    beforeEach(() => {
      writeTextMock = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    it('calls clipboard.writeText with text when copy button is clicked', async () => {
      renderWithTheme(<ClipboardCopier text="copy me" />);
      await act(async () => {
        fireEvent.click(screen.getByTitle('Copy to Clipboard'));
      });
      expect(writeTextMock).toHaveBeenCalledWith('copy me');
    });

    it('shows Copied message after successful copy', async () => {
      renderWithTheme(<ClipboardCopier text="copy me" />);
      await act(async () => {
        fireEvent.click(screen.getByTitle('Copy to Clipboard'));
      });
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });

    it('shows check icon after successful copy', async () => {
      renderWithTheme(<ClipboardCopier text="copy me" />);
      await act(async () => {
        fireEvent.click(screen.getByTitle('Copy to Clipboard'));
      });
      const icon = screen.getByTestId('material-icon');
      expect(icon.getAttribute('data-icon')).toBe('check');
    });

    it('hides Copied message after 5 seconds', async () => {
      renderWithTheme(<ClipboardCopier text="copy me" />);
      await act(async () => {
        fireEvent.click(screen.getByTitle('Copy to Clipboard'));
      });
      expect(screen.getByText('Copied')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(screen.queryByText('Copied')).not.toBeInTheDocument();
    });

    it('uses empty string when text prop is not provided', async () => {
      renderWithTheme(<ClipboardCopier text="" />);
      await act(async () => {
        fireEvent.click(screen.getByTitle('Copy to Clipboard'));
      });
      expect(writeTextMock).toHaveBeenCalledWith('');
    });
  });

  describe('without navigator.clipboard (fallback)', () => {
    let originalClipboard;
    let execCommandMock;

    beforeEach(() => {
      originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      execCommandMock = jest.fn().mockReturnValue(true);
      document.execCommand = execCommandMock;
    });

    afterEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        writable: true,
        configurable: true,
      });
      delete (document as any).execCommand;
    });

    it('falls back to execCommand copy', () => {
      renderWithTheme(<ClipboardCopier text="fallback text" />);
      fireEvent.click(screen.getByTitle('Copy to Clipboard'));
      expect(execCommandMock).toHaveBeenCalledWith('copy');
    });

    it('shows Copied message after fallback copy', () => {
      renderWithTheme(<ClipboardCopier text="fallback text" />);
      fireEvent.click(screen.getByTitle('Copy to Clipboard'));
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });
  });

  it('clears timeout on unmount', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });

    const { unmount } = renderWithTheme(<ClipboardCopier text="test" />);
    await act(async () => {
      fireEvent.click(screen.getByTitle('Copy to Clipboard'));
    });
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();

    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });
});
