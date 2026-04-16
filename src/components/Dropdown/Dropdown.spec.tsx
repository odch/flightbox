import React from 'react';
import { renderWithTheme, screen, fireEvent } from '../../../test/renderWithTheme';
import Dropdown from './Dropdown';

jest.mock('scroll-into-view', () => jest.fn());

// requestAnimationFrame is used in setValue and escape handler;
// replace with synchronous execution to keep state consistent.
global.requestAnimationFrame = (callback => { callback(0); return 0; }) as typeof requestAnimationFrame;

const optionRenderer = option => <span>{option.key}</span>;

const makeOptions = (keys) =>
  keys.map(k => ({ key: k }));

const defaultProps = {
  options: makeOptions(['apple', 'banana', 'cherry']),
  optionRenderer,
  onChange: jest.fn(),
};

describe('Dropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(<Dropdown {...defaultProps} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('renders an input element', () => {
      renderWithTheme(<Dropdown {...defaultProps} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('shows the value in the input when a value is provided', () => {
      renderWithTheme(<Dropdown {...defaultProps} value="banana" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'banana');
    });

    it('shows empty placeholder when no value', () => {
      renderWithTheme(<Dropdown {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect((input as HTMLInputElement).placeholder).toBe('');
    });

    it('renders clear button when clearable and value set', () => {
      renderWithTheme(
        <Dropdown {...defaultProps} value="apple" clearable={true} />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('does not render clear button when clearable but no value', () => {
      renderWithTheme(<Dropdown {...defaultProps} clearable={true} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not render clear button when not clearable', () => {
      renderWithTheme(<Dropdown {...defaultProps} value="apple" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not render clear button when readOnly', () => {
      renderWithTheme(
        <Dropdown {...defaultProps} value="apple" clearable={true} readOnly={true} />
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('valueRenderer', () => {
    it('uses valueRenderer when provided and value matches an option', () => {
      const options = [{ key: 'apple', label: 'Apple Fruit' }];
      const valueRenderer = option => option.label;
      renderWithTheme(
        <Dropdown
          options={options}
          value="apple"
          optionRenderer={optionRenderer}
          valueRenderer={valueRenderer}
          onChange={jest.fn()}
        />
      );
      const input = screen.getByRole('textbox');
      expect((input as HTMLInputElement).placeholder).toBe('Apple Fruit');
    });

    it('falls back to raw key when no valueRenderer', () => {
      renderWithTheme(<Dropdown {...defaultProps} value="cherry" />);
      const input = screen.getByRole('textbox');
      expect((input as HTMLInputElement).placeholder).toBe('cherry');
    });
  });

  describe('options display on focus', () => {
    it('shows options when input is focused and showOptionsOnFocus is true', () => {
      renderWithTheme(
        <Dropdown {...defaultProps} showOptionsOnFocus={true} />
      );
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      expect(screen.getByText('apple')).toBeInTheDocument();
      expect(screen.getByText('banana')).toBeInTheDocument();
    });

    it('does not show options when readOnly', () => {
      renderWithTheme(
        <Dropdown {...defaultProps} readOnly={true} showOptionsOnFocus={true} />
      );
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      expect(screen.queryByText('apple')).not.toBeInTheDocument();
    });

    it('hides options on input blur when mustSelect is false and no filter', () => {
      renderWithTheme(<Dropdown {...defaultProps} showOptionsOnFocus={true} />);
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      expect(screen.getByText('apple')).toBeInTheDocument();
      fireEvent.blur(input);
      expect(screen.queryByText('apple')).not.toBeInTheDocument();
    });

    it('sets value from filter on blur when mustSelect is false', () => {
      const onChange = jest.fn();
      renderWithTheme(
        <Dropdown
          {...defaultProps}
          onChange={onChange}
          mustSelect={false}
        />
      );
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'mango' } });
      fireEvent.blur(input);
      expect(onChange).toHaveBeenCalledWith('mango');
    });
  });

  describe('filtering options', () => {
    it('shows matching options when user types', () => {
      renderWithTheme(<Dropdown {...defaultProps} />);
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'ban' } });
      expect(screen.getByText('banana')).toBeInTheDocument();
      expect(screen.queryByText('apple')).not.toBeInTheDocument();
    });

    it('shows no options when filter matches nothing', () => {
      renderWithTheme(<Dropdown {...defaultProps} />);
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'xyz' } });
      expect(screen.queryByText('apple')).not.toBeInTheDocument();
      expect(screen.queryByText('banana')).not.toBeInTheDocument();
    });

    it('uses custom optionFilter when provided', () => {
      const optionFilter = jest.fn(() => [{ key: 'banana' }]);
      renderWithTheme(
        <Dropdown
          {...defaultProps}
          optionFilter={optionFilter}
        />
      );
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'b' } });
      expect(optionFilter).toHaveBeenCalled();
    });

    it('uses onBeforeInputChange to transform filter', () => {
      const onBeforeInputChange = val => val.toUpperCase();
      renderWithTheme(
        <Dropdown
          {...defaultProps}
          onBeforeInputChange={onBeforeInputChange}
        />
      );
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'a' } });
      // input is now 'A' which won't match lowercase keys
      expect(screen.queryByText('apple')).not.toBeInTheDocument();
    });

    it('shows moreOptionsText when there are more options than the limit', () => {
      const manyOptions = Array.from({ length: 15 }, (_, i) => ({
        key: `opt${i}`,
      }));
      renderWithTheme(
        <Dropdown
          options={manyOptions}
          optionRenderer={optionRenderer}
          onChange={jest.fn()}
          moreOptionsText="Too many"
          optionsRenderLimit={5}
        />
      );
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'opt' } });
      expect(screen.getByText('Too many')).toBeInTheDocument();
    });
  });

  describe('option selection', () => {
    it('calls onChange when an option is clicked (mousedown)', () => {
      const onChange = jest.fn();
      renderWithTheme(
        <Dropdown
          {...defaultProps}
          onChange={onChange}
          showOptionsOnFocus={true}
        />
      );
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.mouseDown(screen.getByText('banana'));
      expect(onChange).toHaveBeenCalledWith('banana');
    });

    it('clears value when clear button is clicked', () => {
      const onChange = jest.fn();
      renderWithTheme(
        <Dropdown
          {...defaultProps}
          value="apple"
          clearable={true}
          onChange={onChange}
        />
      );
      fireEvent.click(screen.getByRole('button'));
      expect(onChange).toHaveBeenCalledWith('');
    });
  });

  describe('keyboard navigation', () => {
    it('arrow down then enter selects next option', () => {
      const onChange = jest.fn();
      const { container } = renderWithTheme(
        <Dropdown {...defaultProps} onChange={onChange} showOptionsOnFocus={true} />
      );
      const input = screen.getByRole('textbox');
      const wrapper = container.firstChild!;
      fireEvent.focus(input);
      // Focus starts on 'apple' (first option). Arrow down moves to 'banana'.
      fireEvent.keyDown(wrapper, { key: 'ArrowDown', keyCode: 40, which: 40 });
      fireEvent.keyDown(wrapper, { key: 'Enter', keyCode: 13, which: 13 });
      expect(onChange).toHaveBeenCalledWith('banana');
    });

    it('arrow up then enter selects previous option', () => {
      const onChange = jest.fn();
      const { container } = renderWithTheme(
        <Dropdown {...defaultProps} onChange={onChange} showOptionsOnFocus={true} value="banana" />
      );
      const input = screen.getByRole('textbox');
      const wrapper = container.firstChild!;
      fireEvent.focus(input);
      // Focus starts on 'banana' (current value). Arrow up moves to 'apple'.
      fireEvent.keyDown(wrapper, { key: 'ArrowUp', keyCode: 38, which: 38 });
      fireEvent.keyDown(wrapper, { key: 'Enter', keyCode: 13, which: 13 });
      expect(onChange).toHaveBeenCalledWith('apple');
    });

    it('selects focused option on enter key', () => {
      const onChange = jest.fn();
      const { container } = renderWithTheme(
        <Dropdown
          {...defaultProps}
          onChange={onChange}
          showOptionsOnFocus={true}
          value="banana"
        />
      );
      const input = screen.getByRole('textbox');
      const wrapper = container.firstChild!;
      fireEvent.focus(input);
      fireEvent.keyDown(wrapper, { key: 'Enter', keyCode: 13, which: 13 });
      expect(onChange).toHaveBeenCalledWith('banana');
    });

    it('does nothing on enter when no focused option', () => {
      const onChange = jest.fn();
      const { container } = renderWithTheme(
        <Dropdown
          options={[]}
          optionRenderer={optionRenderer}
          onChange={onChange}
          showOptionsOnFocus={true}
        />
      );
      const input = screen.getByRole('textbox');
      const wrapper = container.firstChild!;
      fireEvent.focus(input);
      fireEvent.keyDown(wrapper, { key: 'Enter', keyCode: 13, which: 13 });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('ignores arrow keys when no filtered options', () => {
      const onChange = jest.fn();
      const { container } = renderWithTheme(
        <Dropdown {...defaultProps} onChange={onChange} showOptionsOnFocus={true} />
      );
      const input = screen.getByRole('textbox');
      const wrapper = container.firstChild!;
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'zzz' } });
      fireEvent.keyDown(wrapper, { key: 'ArrowDown', keyCode: 40, which: 40 });
      fireEvent.keyDown(wrapper, { key: 'Enter', keyCode: 13, which: 13 });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not navigate beyond optionsRenderLimit', () => {
      const onChange = jest.fn();
      const manyOptions = Array.from({ length: 15 }, (_, i) => ({ key: `opt${i}` }));
      const { container } = renderWithTheme(
        <Dropdown
          options={manyOptions}
          optionRenderer={optionRenderer}
          onChange={onChange}
          showOptionsOnFocus={true}
          optionsRenderLimit={3}
          value="opt2"
        />
      );
      const input = screen.getByRole('textbox');
      const wrapper = container.firstChild!;
      fireEvent.focus(input);
      // Focus on opt2 (last rendered). Arrow down should wrap to opt0, not go to opt3.
      fireEvent.keyDown(wrapper, { key: 'ArrowDown', keyCode: 40, which: 40 });
      fireEvent.keyDown(wrapper, { key: 'Enter', keyCode: 13, which: 13 });
      expect(onChange).toHaveBeenCalledWith('opt0');
    });
  });

  describe('onFocus and onBlur callbacks', () => {
    it('calls onFocus when input is focused', () => {
      const onFocus = jest.fn();
      renderWithTheme(<Dropdown {...defaultProps} onFocus={onFocus} />);
      fireEvent.focus(screen.getByRole('textbox'));
      expect(onFocus).toHaveBeenCalled();
    });
  });

  describe('mouse events on options', () => {
    it('highlights option on mouse enter', () => {
      renderWithTheme(
        <Dropdown {...defaultProps} showOptionsOnFocus={true} />
      );
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.mouseEnter(screen.getByText('cherry'));
      // Just verify no crash and option is still present
      expect(screen.getByText('cherry')).toBeInTheDocument();
    });

    it('clears highlight on options container mouse leave', () => {
      renderWithTheme(
        <Dropdown {...defaultProps} showOptionsOnFocus={true} />
      );
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      const container = document.querySelector('.flightbox-dropdown-options-container');
      fireEvent.mouseLeave(container!);
      expect(screen.getByText('apple')).toBeInTheDocument();
    });
  });

  describe('prop updates via componentWillReceiveProps', () => {
    it('updates displayed value when value prop changes', () => {
      const { ThemeProvider } = require('styled-components');
      const { BrowserRouter } = require('react-router-dom');
      const { render: rtlRender } = require('@testing-library/react');
      const theme = {
        colors: { main: '#003863', background: '#fafafa', danger: '#e00f00' },
      };
      const wrap = el => (
        <BrowserRouter>
          <ThemeProvider theme={theme}>{el}</ThemeProvider>
        </BrowserRouter>
      );
      const { rerender } = rtlRender(
        wrap(<Dropdown {...defaultProps} value="apple" />)
      );
      rerender(wrap(<Dropdown {...defaultProps} value="cherry" />));
      const input = screen.getByRole('textbox');
      expect((input as HTMLInputElement).placeholder).toBe('cherry');
    });
  });

  describe('dataCy prop', () => {
    it('passes dataCy to input', () => {
      renderWithTheme(<Dropdown {...defaultProps} dataCy="my-dropdown" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('data-cy', 'my-dropdown');
    });
  });

  describe('escape key', () => {
    it('handles escape key without crashing', () => {
      const { container } = renderWithTheme(
        <Dropdown {...defaultProps} showOptionsOnFocus={true} />
      );
      const input = screen.getByRole('textbox');
      const wrapper = container.firstChild!;
      fireEvent.focus(input);
      fireEvent.keyDown(wrapper, { which: 27 }); // escape
      // No crash expected
      expect(input).toBeInTheDocument();
    });
  });

  describe('initially focused option when value is set', () => {
    it('focuses current value option on focus when value is set', () => {
      renderWithTheme(
        <Dropdown {...defaultProps} value="banana" showOptionsOnFocus={true} />
      );
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      expect(screen.getByText('banana')).toBeInTheDocument();
    });
  });

  describe('arrow navigation wrapping', () => {
    it('wraps to last option when pressing arrow up at first option', () => {
      const onChange = jest.fn();
      const { container } = renderWithTheme(
        <Dropdown {...defaultProps} onChange={onChange} showOptionsOnFocus={true} />
      );
      const input = screen.getByRole('textbox');
      const wrapper = container.firstChild!;
      fireEvent.focus(input);
      // Focus starts on 'apple'. Arrow up wraps to 'cherry'.
      fireEvent.keyDown(wrapper, { key: 'ArrowUp', keyCode: 38, which: 38 });
      fireEvent.keyDown(wrapper, { key: 'Enter', keyCode: 13, which: 13 });
      expect(onChange).toHaveBeenCalledWith('cherry');
    });

    it('wraps to first option when pressing arrow down at last option', () => {
      const onChange = jest.fn();
      const { container } = renderWithTheme(
        <Dropdown {...defaultProps} onChange={onChange} showOptionsOnFocus={true} value="cherry" />
      );
      const input = screen.getByRole('textbox');
      const wrapper = container.firstChild!;
      fireEvent.focus(input);
      // Focus starts on 'cherry'. Arrow down wraps to 'apple'.
      fireEvent.keyDown(wrapper, { key: 'ArrowDown', keyCode: 40, which: 40 });
      fireEvent.keyDown(wrapper, { key: 'Enter', keyCode: 13, which: 13 });
      expect(onChange).toHaveBeenCalledWith('apple');
    });
  });

  describe('options container mouse interaction', () => {
    it('keeps options open when mousedown on options container (scrollbar)', () => {
      renderWithTheme(
        <Dropdown {...defaultProps} showOptionsOnFocus={true} />
      );
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      expect(screen.getByText('apple')).toBeInTheDocument();

      const optionsContainer = document.querySelector('.flightbox-dropdown-options-container')!;
      fireEvent.mouseDown(optionsContainer);
      // Options should still be visible — preventDefault keeps focus on input
      expect(screen.getByText('apple')).toBeInTheDocument();
    });

    it('hides options after selecting via mousedown on an option', () => {
      const onChange = jest.fn();
      renderWithTheme(
        <Dropdown {...defaultProps} onChange={onChange} showOptionsOnFocus={true} />
      );
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      expect(screen.getByText('banana')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByText('banana'));
      expect(onChange).toHaveBeenCalledWith('banana');
      // Options should be hidden after selection
      expect(screen.queryByText('apple')).not.toBeInTheDocument();
    });
  });
});
