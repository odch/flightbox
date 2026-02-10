import React from 'react';
import {render} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import OptionalLink from "./OptionalLink";
import {renderWithTheme} from '../../../test/renderWithTheme'

describe('components', () => {
  describe('ImageButton', () => {
    describe('OptionalLink', () => {
      it('renders Link component if `href` prop is set', () => {
        const { container } = renderWithTheme(
          <BrowserRouter>
            <OptionalLink href="/some/path"/>
          </BrowserRouter>
        );

        expect(container).toMatchSnapshot();
      });

      it('renders no Link component if `href` prop is not set', () => {
        const { container } = render(<OptionalLink onClick={() => {}}/>);

        expect(container).toMatchSnapshot();
      });
    });
  });
});
