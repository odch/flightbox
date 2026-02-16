import React from 'react';
import {render} from '@testing-library/react';
import ImageButton from './ImageButton';
import {renderWithTheme} from '../../../test/renderWithTheme'

describe('components', () => {
  describe('ImageButton', () => {
    it('renders label and image', () => {
      const { container } = render(<ImageButton label="my label" img="imgsource.jpg"/>);

      expect(container).toMatchSnapshot();
    });

    it('propagates href to OptionalLink', () => {
      const { container } = renderWithTheme(<ImageButton label="" img="" href="/some/path"/>);

      expect(container).toMatchSnapshot();
    });

    it('propagates onClick to OptionalLink', () => {
      const { container } = render(<ImageButton label="" img="" onClick={() => {}}/>);

      expect(container).toMatchSnapshot();
    });
  });
});
