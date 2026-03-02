import React from 'react';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter } from 'react-router-dom';
import { render, fireEvent, act } from '@testing-library/react';
import { AutoLoad } from './AutoLoad';

const theme = {
  colors: {
    main: '#003863',
    background: '#fafafa',
    danger: '#e00f00',
  },
};

function renderWithTheme(component) {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </BrowserRouter>
  );
}

function Wrapper({ children }) {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </BrowserRouter>
  );
}

const SimpleList = ({ items }) => (
  <ul>
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

describe('util', () => {
  describe('AutoLoad', () => {
    const loadItems = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('renders the wrapped List component', () => {
      const AutoLoadList = AutoLoad(SimpleList);
      const { container } = renderWithTheme(
        <AutoLoadList items={['a', 'b']} loadItems={loadItems} />
      );
      expect(container.querySelectorAll('li').length).toBe(2);
    });

    it('renders a bottom marker div', () => {
      const AutoLoadList = AutoLoad(SimpleList);
      const { container } = renderWithTheme(
        <AutoLoadList items={[]} loadItems={loadItems} />
      );
      const divs = container.querySelectorAll('div');
      expect(divs.length).toBeGreaterThanOrEqual(2);
    });

    it('applies className to outer div', () => {
      const AutoLoadList = AutoLoad(SimpleList);
      const { container } = renderWithTheme(
        <AutoLoadList items={[]} loadItems={loadItems} className="my-list" />
      );
      expect(container.querySelector('.my-list')).toBeTruthy();
    });

    it('passes props through to the wrapped component', () => {
      const AutoLoadList = AutoLoad(SimpleList);
      const { getByText } = renderWithTheme(
        <AutoLoadList items={['hello']} loadItems={loadItems} />
      );
      expect(getByText('hello')).toBeTruthy();
    });

    it('does not crash when items array is empty', () => {
      const AutoLoadList = AutoLoad(SimpleList);
      const { container } = renderWithTheme(
        <AutoLoadList items={[]} loadItems={loadItems} />
      );
      expect(container).toBeTruthy();
    });

    it('calls loadItems in componentDidUpdate when items grow and bottom marker is in viewport', () => {
      const AutoLoadList = AutoLoad(SimpleList);

      const { rerender } = render(
        <Wrapper>
          <AutoLoadList items={['a']} loadItems={loadItems} />
        </Wrapper>
      );

      act(() => {
        rerender(
          <Wrapper>
            <AutoLoadList items={['a', 'b']} loadItems={loadItems} />
          </Wrapper>
        );
      });

      // In jsdom getBoundingClientRect returns all zeros so isElementInViewport returns true
      expect(loadItems).toHaveBeenCalled();
    });

    it('does not call loadItems in componentDidUpdate when items list does not grow', () => {
      const AutoLoadList = AutoLoad(SimpleList);

      const { rerender } = render(
        <Wrapper>
          <AutoLoadList items={['a', 'b']} loadItems={loadItems} />
        </Wrapper>
      );

      act(() => {
        rerender(
          <Wrapper>
            <AutoLoadList items={['a', 'b']} loadItems={loadItems} />
          </Wrapper>
        );
      });

      expect(loadItems).not.toHaveBeenCalled();
    });

    it('calls loadItems on scroll when document end is reached', () => {
      const AutoLoadList = AutoLoad(SimpleList);
      renderWithTheme(
        <AutoLoadList items={['a']} loadItems={loadItems} />
      );

      // The component adds scroll listener to window (no overflow:auto/scroll in jsdom)
      // Firing scroll with target=document triggers the document branch of isEndReached:
      // window.innerHeight(768) + scrollY(0) + threshold(50) >= document.body.offsetHeight(0) => true
      const scrollEvent = new Event('scroll');
      Object.defineProperty(scrollEvent, 'target', { value: document });
      window.dispatchEvent(scrollEvent);

      expect(loadItems).toHaveBeenCalledTimes(1);
    });

    it('does not call loadItems on scroll when autoLoadDisabled is true', () => {
      const AutoLoadList = AutoLoad(SimpleList);
      renderWithTheme(
        <AutoLoadList items={['a']} loadItems={loadItems} autoLoadDisabled={true} />
      );

      const scrollEvent = new Event('scroll');
      Object.defineProperty(scrollEvent, 'target', { value: document });
      window.dispatchEvent(scrollEvent);

      expect(loadItems).not.toHaveBeenCalled();
    });

    it('uses custom bottomThreshold when provided as a number', () => {
      const AutoLoadList = AutoLoad(SimpleList);
      const { container } = renderWithTheme(
        <AutoLoadList items={['a']} loadItems={loadItems} bottomThreshold={0} />
      );

      const scrollEvent = new Event('scroll');
      Object.defineProperty(scrollEvent, 'target', { value: document });
      window.dispatchEvent(scrollEvent);

      expect(loadItems).toHaveBeenCalled();
      expect(container).toBeTruthy();
    });

    it('unmounts cleanly removing scroll listener', () => {
      const AutoLoadList = AutoLoad(SimpleList);
      const { unmount } = renderWithTheme(
        <AutoLoadList items={['a']} loadItems={loadItems} />
      );
      expect(() => unmount()).not.toThrow();
    });
  });
});
