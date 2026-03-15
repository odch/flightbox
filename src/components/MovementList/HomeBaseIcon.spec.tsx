import React from 'react';
import {renderWithTheme} from '../../../test/renderWithTheme';

jest.mock('../MaterialIcon', () => {
  const React = require('react');
  return function MockMaterialIcon({icon, title}) {
    return <span data-testid="material-icon" data-icon={icon} title={title} />;
  };
});

// HomeBaseIcon is a class component wrapped with withTranslation()
import HomeBaseIcon from './HomeBaseIcon';

describe('components', () => {
  describe('MovementList', () => {
    describe('HomeBaseIcon', () => {
      beforeEach(() => {
        global.__CONF__ = {aerodrome: {name: 'Thun'}};
      });

      it('renders with isHomeBase=true', () => {
        const {container} = renderWithTheme(
          <HomeBaseIcon isHomeBase={true} />
        );
        expect(container.firstChild).toBeTruthy();
      });

      it('renders with isHomeBase=false', () => {
        const {container} = renderWithTheme(
          <HomeBaseIcon isHomeBase={false} />
        );
        expect(container.firstChild).toBeTruthy();
      });

      it('renders text when showText=true', () => {
        const {container} = renderWithTheme(
          <HomeBaseIcon isHomeBase={true} showText={true} />
        );
        expect(container.textContent.length).toBeGreaterThan(0);
      });

      it('renders without text by default', () => {
        const {queryByText} = renderWithTheme(
          <HomeBaseIcon isHomeBase={false} />
        );
        // Without showText, the text div is not rendered
        // The icon still has a title attribute
        expect(document.querySelector('[data-testid="material-icon"]')).toBeTruthy();
      });
    });
  });
});
