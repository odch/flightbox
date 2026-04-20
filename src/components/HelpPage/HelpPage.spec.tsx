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

jest.mock('../VerticalHeaderLayout', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../JumpNavigation', () => ({
  __esModule: true,
  default: () => <div data-testid="jump-nav" />,
}));

const origConf = (global as any).__CONF__;

(global as any).__CONF__ = {
  aerodrome: { name: 'Testfield', ICAO: 'LSZT' },
};

import HelpPage from './HelpPage';

describe('<HelpPage>', () => {
  let scrollIntoViewSpy: jest.Mock;
  let originalScrollIntoView: any;

  beforeEach(() => {
    (global as any).__CONF__ = {
      aerodrome: { name: 'Testfield', ICAO: 'LSZT' },
    };
    originalScrollIntoView = (HTMLElement.prototype as any).scrollIntoView;
    scrollIntoViewSpy = jest.fn();
    (HTMLElement.prototype as any).scrollIntoView = scrollIntoViewSpy;
  });

  afterEach(() => {
    (HTMLElement.prototype as any).scrollIntoView = originalScrollIntoView;
    (global as any).__CONF__ = origConf;
  });

  const renderPage = () => renderWithTheme(<HelpPage />);

  it('renders one question item per question in the nav list', () => {
    const { container } = renderPage();
    const items = container.querySelectorAll('ol > li');
    expect(items.length).toBeGreaterThan(0);
  });

  it('scrolls the nth LabeledBox into view when the nth question is clicked', () => {
    const { container } = renderPage();
    const items = container.querySelectorAll('ol > li');
    fireEvent.click(items[2]);
    expect(scrollIntoViewSpy).toHaveBeenCalledTimes(1);
  });

  it('calls scrollIntoView each time a question is clicked', () => {
    const { container } = renderPage();
    const items = container.querySelectorAll('ol > li');
    fireEvent.click(items[0]);
    fireEvent.click(items[1]);
    expect(scrollIntoViewSpy).toHaveBeenCalledTimes(2);
  });

  it('scrollIntoView is called on a DOM element (i.e. box ref was captured)', () => {
    const { container } = renderPage();
    const items = container.querySelectorAll('ol > li');
    fireEvent.click(items[0]);
    const calledOn = scrollIntoViewSpy.mock.instances[0];
    expect(calledOn).toBeInstanceOf(HTMLElement);
  });
});
