import React from 'react';
import { renderWithTheme, fireEvent } from '../../../test/renderWithTheme';

jest.mock('react-i18next', () => ({
  withTranslation: () => (Component: any) => {
    const Wrapped = (props: any) => (
      <Component {...props} t={(key: string) => key} />
    );
    Wrapped.displayName = `withTranslation(${Component.displayName || Component.name})`;
    return Wrapped;
  },
  Trans: ({ i18nKey }: { i18nKey: string }) => <>{i18nKey}</>,
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../MaterialIcon', () => ({
  __esModule: true,
  default: ({ icon }: any) => <span data-testid="material-icon" data-icon={icon} />,
}));

import MaskedInput from './MaskedInput';

const makeProps = ({ input, meta, ...rest }: any = {}) => ({
  input: {
    name: 'phone',
    value: '+41 79 123 45 67',
    onChange: jest.fn(),
    onFocus: jest.fn(),
    onBlur: jest.fn(),
    ...input,
  },
  meta: { active: false, ...meta },
  type: 'tel',
  ...rest,
});

describe('<MaskedInput>', () => {
  describe('when value present and field not active', () => {
    it('renders masked content', () => {
      const props = makeProps();
      const { container } = renderWithTheme(<MaskedInput {...props} />);
      expect(container.textContent).not.toContain('+41 79 123 45 67');
      expect(container.querySelector('[data-cy="phone"]')).toBeTruthy();
    });

    it('renders clear button', () => {
      const { getByTestId } = renderWithTheme(<MaskedInput {...makeProps()} />);
      expect(getByTestId('material-icon').getAttribute('data-icon')).toBe('clear');
    });

    it('shows tooltip on mouse enter', () => {
      const { container } = renderWithTheme(<MaskedInput {...makeProps()} />);
      const wrapper = container.querySelector('[data-cy="phone"]')!;
      expect(container.textContent).not.toContain('maskedInput.tooltip');
      fireEvent.mouseEnter(wrapper);
      expect(container.textContent).toContain('maskedInput.tooltip');
    });

    it('hides tooltip on mouse leave', () => {
      const { container } = renderWithTheme(<MaskedInput {...makeProps()} />);
      const wrapper = container.querySelector('[data-cy="phone"]')!;
      fireEvent.mouseEnter(wrapper);
      fireEvent.mouseLeave(wrapper);
      expect(container.textContent).not.toContain('maskedInput.tooltip');
    });

    it('calls onChange(null) when clear button is clicked', () => {
      const onChange = jest.fn();
      const props = makeProps({ input: { onChange } });
      const { container } = renderWithTheme(<MaskedInput {...props} />);
      const clearBtn = container.querySelector('button')!;
      fireEvent.click(clearBtn);
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('masks email differently from phone', () => {
      const emailProps = makeProps({
        input: { name: 'e', value: 'roland@example.com', onChange: jest.fn() },
        type: 'email',
      });
      const { container } = renderWithTheme(<MaskedInput {...emailProps} />);
      expect(container.textContent).not.toContain('roland@example.com');
    });
  });

  describe('when field active', () => {
    it('renders raw input (unmasked)', () => {
      const props = makeProps({ meta: { active: true } });
      const { container } = renderWithTheme(<MaskedInput {...props} />);
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.value).toBe('+41 79 123 45 67');
    });
  });

  describe('when value empty', () => {
    it('renders raw input', () => {
      const props = makeProps({ input: { value: '' } });
      const { container } = renderWithTheme(<MaskedInput {...props} />);
      expect(container.querySelector('input')).toBeTruthy();
    });
  });
});
