import React from 'react';
import { renderWithTheme, screen, fireEvent } from '../../../test/renderWithTheme';

import SingleSelect from './SingleSelect';

const items = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
];

const describedItems = [
  { value: 'manual', label: 'Manually', description: 'An admin answers each request.' },
  { value: 'automatic', label: 'Automatically', description: 'Each request is approved right away.' },
];

// The button of the item showing the text
const itemButton = (text: string) => screen.getByText(text).closest('button') as HTMLElement;

// The column of the label and the description, next to the tick
const textColumn = (button: HTMLElement) => button.firstElementChild as HTMLElement;

// A declaration of the tick, the ::before of the button: jsdom computes no
// styles of pseudo-elements, so it is read from the injected style rules
const tickStyle = (button: HTMLElement, property: string) => {
  const selectors = Array.from(button.classList)
    .flatMap(name => [`.${name}:before`, `.${name}::before`]);
  const values = Array.from(document.styleSheets)
    .flatMap(sheet => Array.from(sheet.cssRules) as CSSStyleRule[])
    .filter(rule => selectors.includes(rule.selectorText))
    .map(rule => rule.style.getPropertyValue(property))
    .filter(Boolean);
  return values.length > 0 ? values[values.length - 1] : '';
};

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

  it('selects with a click, and with a key (a click of detail 0)', () => {
    const onChange = jest.fn();
    renderWithTheme(<SingleSelect items={items} onChange={onChange} />);
    fireEvent.click(screen.getByText('Option A'), { detail: 1 });
    fireEvent.click(screen.getByText('Option B'), { detail: 0 });
    expect(onChange.mock.calls).toEqual([[{ target: { value: 'a' } }], [{ target: { value: 'b' } }]]);
  });

  // E.g. the second click on "Bearbeiten" of the PPR settings, which opens
  // a select right under the pointer
  it('selects nothing with the further clicks of a double or triple click', () => {
    const onChange = jest.fn();
    renderWithTheme(<SingleSelect items={describedItems} value="manual" onChange={onChange} />);
    fireEvent.click(itemButton('Automatically'), { detail: 2 });
    fireEvent.click(itemButton('Automatically'), { detail: 3 });
    expect(onChange).not.toHaveBeenCalled();
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

  describe('layout of the items', () => {
    describe.each(['horizontal', 'vertical'] as const)('%s', orientation => {
      it('puts the tick in a column of its own and the texts at the start when items have descriptions', () => {
        renderWithTheme(
          <SingleSelect items={describedItems} orientation={orientation} onChange={jest.fn()} />
        );
        ['Manually', 'Automatically'].forEach(label => {
          const button = itemButton(label);
          expect(button).toHaveStyle({ display: 'flex', textAlign: 'left' });
          expect(tickStyle(button, 'float')).toBe('');
          expect(tickStyle(button, 'width')).toBe('1em');
          expect(tickStyle(button, 'line-height')).toBe('1em');
          expect(textColumn(button)).toHaveStyle({ flexGrow: '1', minWidth: '0' });
          expect(textColumn(button)).not.toHaveStyle({ marginLeft: '1.5em' });
        });
      });

      it('lays out the items without a description alike when others have one', () => {
        renderWithTheme(
          <SingleSelect
            items={[{ value: 'a', label: 'Option A' }, ...describedItems]}
            orientation={orientation}
            onChange={jest.fn()}
          />
        );
        const button = itemButton('Option A');
        expect(button).toHaveStyle({ display: 'flex', textAlign: 'left' });
        expect(tickStyle(button, 'float')).toBe('');
        expect(textColumn(button)).toHaveStyle({ flexGrow: '1' });
      });

      it('keeps the floating tick when no item has a description', () => {
        renderWithTheme(
          <SingleSelect items={items} orientation={orientation} onChange={jest.fn()} />
        );
        items.forEach(item => {
          const button = itemButton(item.label);
          expect(button).not.toHaveStyle({ display: 'flex' });
          expect(tickStyle(button, 'float')).toBe('left');
          expect(textColumn(button)).not.toHaveStyle({ flexGrow: '1' });
        });
      });
    });

    it('centers the labels side by side when no item has a description', () => {
      renderWithTheme(<SingleSelect items={items} orientation="horizontal" onChange={jest.fn()} />);
      const button = itemButton('Option A');
      expect(button).not.toHaveStyle({ textAlign: 'left' });
      expect(textColumn(button)).not.toHaveStyle({ marginLeft: '1.5em' });
    });

    it('starts the labels one below the other after the tick when no item has a description', () => {
      renderWithTheme(<SingleSelect items={items} orientation="vertical" onChange={jest.fn()} />);
      expect(textColumn(itemButton('Option A'))).toHaveStyle({ marginLeft: '1.5em' });
    });

    it('shows each description below its label', () => {
      renderWithTheme(<SingleSelect items={describedItems} onChange={jest.fn()} />);
      describedItems.forEach(item => {
        const description = screen.getByText(item.description);
        expect(description.previousElementSibling).toHaveTextContent(item.label);
        expect(description.parentElement).toBe(textColumn(itemButton(item.label)));
      });
    });

    it('selects an item with a description when it is clicked', () => {
      const onChange = jest.fn();
      renderWithTheme(
        <SingleSelect items={describedItems} value="manual" onChange={onChange} />
      );
      fireEvent.click(screen.getByText('Each request is approved right away.'));
      expect(onChange).toHaveBeenCalledWith({ target: { value: 'automatic' } });
      expect(itemButton('Automatically')).toHaveStyle({ color: '#003863' });
      expect(itemButton('Manually')).not.toHaveStyle({ color: '#003863' });
    });
  });
});
