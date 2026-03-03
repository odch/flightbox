import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../containers/AerodromeDropdownContainer', () => {
  const React = require('react');
  return function AerodromeDropdown(props) {
    return <div data-testid="aerodrome-dropdown" />;
  };
});

jest.mock('../containers/AircraftDropdownContainer', () => {
  const React = require('react');
  return function AircraftDropdown(props) {
    return <div data-testid="aircraft-dropdown" />;
  };
});

jest.mock('../containers/UserDropdownContainer', () => {
  const React = require('react');
  return function UserDropdown(props) {
    return <div data-testid="user-dropdown" />;
  };
});

import {
  renderInputField,
  renderSingleSelect,
  renderIncrementationField,
  renderDateField,
  renderTimeField,
  renderDurationField,
  renderTextArea,
  renderAerodromeDropdown,
  renderAircraftDropdown,
  renderUserDropdown,
} from './renderField';

const theme = {
  colors: {
    main: '#003863',
    background: '#fafafa',
    danger: '#e00f00',
  },
};

function renderWithTheme(component: React.ReactElement) {
  const Router = BrowserRouter as any;
  return render(
    <Router>
      <ThemeProvider theme={theme as any}>{component}</ThemeProvider>
    </Router>
  );
}

const baseInput = {
  value: '',
  onChange: jest.fn(),
  onFocus: jest.fn(),
  onBlur: jest.fn(),
};

const baseMeta = {
  touched: false,
  error: null,
};

const baseProps = {
  input: baseInput,
  name: 'testField',
  label: 'Test Label',
  type: 'text',
  readOnly: false,
  meta: baseMeta,
};

describe('util', () => {
  describe('renderField', () => {
    describe('renderInputField', () => {
      it('renders without crashing', () => {
        const { container } = renderWithTheme(renderInputField(baseProps));
        expect(container).toBeTruthy();
      });

      it('renders with the label text', () => {
        const { getByText } = renderWithTheme(renderInputField(baseProps));
        expect(getByText('Test Label')).toBeTruthy();
      });

      it('renders validation error when touched and error present', () => {
        const props = {
          ...baseProps,
          meta: { touched: true, error: 'Required' },
        };
        const { getByText } = renderWithTheme(renderInputField(props));
        expect(getByText('Required')).toBeTruthy();
      });

      it('does not render validation error when not touched', () => {
        const props = {
          ...baseProps,
          meta: { touched: false, error: 'Required' },
        };
        const { queryByText } = renderWithTheme(renderInputField(props));
        expect(queryByText('Required')).toBeNull();
      });

      it('renders with readOnly true', () => {
        const props = { ...baseProps, readOnly: true };
        const { container } = renderWithTheme(renderInputField(props));
        expect(container).toBeTruthy();
      });
    });

    describe('renderSingleSelect', () => {
      it('renders without crashing', () => {
        const props = {
          ...baseProps,
          items: [{ value: 'a', label: 'A' }],
          orientation: 'horizontal',
        };
        const { container } = renderWithTheme(renderSingleSelect(props));
        expect(container).toBeTruthy();
      });

      it('renders the label', () => {
        const props = {
          ...baseProps,
          label: 'Select Field',
          items: [],
        };
        const { getByText } = renderWithTheme(renderSingleSelect(props));
        expect(getByText('Select Field')).toBeTruthy();
      });
    });

    describe('renderIncrementationField', () => {
      it('renders without crashing', () => {
        const { container } = renderWithTheme(renderIncrementationField(baseProps));
        expect(container).toBeTruthy();
      });

      it('renders the label', () => {
        const { getByText } = renderWithTheme(renderIncrementationField(baseProps));
        expect(getByText('Test Label')).toBeTruthy();
      });
    });

    describe('renderDateField', () => {
      it('renders without crashing', () => {
        const { container } = renderWithTheme(renderDateField(baseProps));
        expect(container).toBeTruthy();
      });

      it('renders the label', () => {
        const { getByText } = renderWithTheme(renderDateField(baseProps));
        expect(getByText('Test Label')).toBeTruthy();
      });
    });

    describe('renderTimeField', () => {
      it('renders without crashing', () => {
        const { container } = renderWithTheme(renderTimeField(baseProps));
        expect(container).toBeTruthy();
      });

      it('renders the label', () => {
        const { getByText } = renderWithTheme(renderTimeField(baseProps));
        expect(getByText('Test Label')).toBeTruthy();
      });
    });

    describe('renderDurationField', () => {
      it('renders without crashing', () => {
        const { container } = renderWithTheme(renderDurationField(baseProps));
        expect(container).toBeTruthy();
      });

      it('renders the label', () => {
        const { getByText } = renderWithTheme(renderDurationField(baseProps));
        expect(getByText('Test Label')).toBeTruthy();
      });
    });

    describe('renderTextArea', () => {
      it('renders without crashing', () => {
        const { container } = renderWithTheme(renderTextArea(baseProps));
        expect(container).toBeTruthy();
      });

      it('renders the label', () => {
        const { getByText } = renderWithTheme(renderTextArea(baseProps));
        expect(getByText('Test Label')).toBeTruthy();
      });
    });

    describe('renderAerodromeDropdown', () => {
      it('renders without crashing', () => {
        const { container } = renderWithTheme(renderAerodromeDropdown(baseProps));
        expect(container).toBeTruthy();
      });

      it('renders the label', () => {
        const { getByText } = renderWithTheme(renderAerodromeDropdown(baseProps));
        expect(getByText('Test Label')).toBeTruthy();
      });
    });

    describe('renderAircraftDropdown', () => {
      it('renders without crashing', () => {
        const { container } = renderWithTheme(renderAircraftDropdown(baseProps));
        expect(container).toBeTruthy();
      });

      it('renders the label', () => {
        const { getByText } = renderWithTheme(renderAircraftDropdown(baseProps));
        expect(getByText('Test Label')).toBeTruthy();
      });
    });

    describe('renderUserDropdown', () => {
      it('renders without crashing', () => {
        const { container } = renderWithTheme(renderUserDropdown(baseProps));
        expect(container).toBeTruthy();
      });

      it('renders the label', () => {
        const { getByText } = renderWithTheme(renderUserDropdown(baseProps));
        expect(getByText('Test Label')).toBeTruthy();
      });
    });
  });
});
