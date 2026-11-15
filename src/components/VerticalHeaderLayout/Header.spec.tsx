import React from 'react';
import { renderWithTheme, screen } from '../../../test/renderWithTheme';

jest.mock('../Logo', () => () => <img alt="logo"/>);
jest.mock('../LanguageSwitch', () => () => <div/>);

import Header from './Header';

describe('VerticalHeaderLayout Header', () => {
  beforeEach(() => {
    (global as any).__CONF__ = { aerodrome: { name: 'Langenthal' } };
  });

  afterEach(() => {
    delete (global as any).__CONF__;
  });

  it('shows the aerodrome', () => {
    renderWithTheme(<Header/>);
    expect(screen.getByText('Langenthal')).toBeTruthy();
  });

  it('leads to the start page with the logo', () => {
    renderWithTheme(<Header/>);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/');
  });

  it('can lead elsewhere with the logo', () => {
    renderWithTheme(<Header homePath="/ppr/new"/>);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/ppr/new');
  });
});
