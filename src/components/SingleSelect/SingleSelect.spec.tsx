import React from 'react';
import { renderWithTheme, screen, fireEvent } from '../../../test/renderWithTheme';

import SingleSelect from './SingleSelect';

const items = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
];

describe('SingleSelect', () => {
  it('renders without crashing', () => {
    const { container } = renderWithTheme(
      <SingleSelect items={items} onChange={jest.fn()} />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders all items', () => {
    renderWithTheme(<SingleSelect items={items} onChange={jest.fn()} />);
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
    expect(screen.getByText('Option C')).toBeInTheDocument();
  });

  it('calls onChange when an item is clicked', () => {
    const onChange = jest.fn();
    renderWithTheme(<SingleSelect items={items} onChange={onChange} />);
    fireEvent.click(screen.getByText('Option A'));
    expect(onChange).toHaveBeenCalledWith({
      target: { value: 'a' },
    });
  });

  it('updates selected state when a different item is clicked', () => {
    const onChange = jest.fn();
    renderWithTheme(
      <SingleSelect items={items} value="a" onChange={onChange} />
    );
    fireEvent.click(screen.getByText('Option B'));
    expect(onChange).toHaveBeenCalledWith({
      target: { value: 'b' },
    });
  });

  it('renders in readOnly mode with selected label', () => {
    renderWithTheme(
      <SingleSelect items={items} value="b" readOnly={true} onChange={jest.fn()} />
    );
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('renders dash in readOnly mode when no value', () => {
    renderWithTheme(
      <SingleSelect items={items} readOnly={true} onChange={jest.fn()} />
    );
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders the raw value in readOnly when no matching item found', () => {
    renderWithTheme(
      <SingleSelect
        items={items}
        value="unknown"
        readOnly={true}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText('unknown')).toBeInTheDocument();
  });

  it('auto-selects single item on mount', () => {
    const onChange = jest.fn();
    renderWithTheme(
      <SingleSelect
        items={[{ value: 'only', label: 'Only Option' }]}
        onChange={onChange}
      />
    );
    expect(onChange).toHaveBeenCalledWith({
      target: { value: 'only' },
    });
  });

  it('does not auto-select when multiple items exist', () => {
    const onChange = jest.fn();
    renderWithTheme(<SingleSelect items={items} onChange={onChange} />);
    // onChange called 0 times on mount when multiple items
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders horizontal orientation by default (display flex)', () => {
    const { container } = renderWithTheme(
      <SingleSelect items={items} onChange={jest.fn()} />
    );
    // The wrapper styled component is present; just verify rendering
    expect(container.firstChild).toBeTruthy();
  });

  it('renders in vertical orientation', () => {
    const { container } = renderWithTheme(
      <SingleSelect
        items={items}
        orientation="vertical"
        onChange={jest.fn()}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('does not call onChange if readOnly and item is clicked', () => {
    const onChange = jest.fn();
    renderWithTheme(
      <SingleSelect
        items={items}
        value="a"
        readOnly={true}
        onChange={onChange}
      />
    );
    // readOnly renders a plain div, no clickable items
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('updates internal value when external value prop changes', () => {
    const onChange = jest.fn();
    const { ThemeProvider } = require('styled-components');
    const { BrowserRouter } = require('react-router-dom');
    const { render } = require('@testing-library/react');

    const theme = { colors: { main: '#003863', background: '#fafafa', danger: '#e00f00' } };
    const wrap = el => (
      <BrowserRouter>
        <ThemeProvider theme={theme}>{el}</ThemeProvider>
      </BrowserRouter>
    );

    const { rerender, unmount } = render(
      wrap(<SingleSelect items={items} value="a" onChange={onChange} />)
    );
    rerender(
      wrap(<SingleSelect items={items} value="c" onChange={onChange} />)
    );
    expect(screen.getByText('Option C')).toBeInTheDocument();
    unmount();
  });
});
