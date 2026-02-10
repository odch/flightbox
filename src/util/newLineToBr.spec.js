import React from 'react';
import {render} from '@testing-library/react';
import newLineToBr from './newLineToBr';

describe('util', () => {
  describe('newLineToBr', () => {
    it('should return the given value if null given', () => {
      const value = null;
      const result = newLineToBr(value);
      expect(result).toBe(null);
    });

    it('should return a span with <br> for each line', () => {
      const value =
        'my\n' +
        'multi\n' +
        'line\n' +
        'text';

      const result = newLineToBr(value);

      const { container } = render(<div>{result}</div>);

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
