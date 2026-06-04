import React from 'react';
import {fireEvent} from '@testing-library/react';
import {renderWithTheme} from '../../../test/renderWithTheme';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}));

import AerodromeStatusBannerToggle from './AerodromeStatusBannerToggle';

describe('components', () => {
  describe('AerodromeStatusBannerToggle', () => {
    it('reflects the enabled state in the checkbox', () => {
      const {container} = renderWithTheme(
        <AerodromeStatusBannerToggle enabled={true} setAerodromeStatusBannerEnabled={jest.fn()}/>
      );
      expect((container.querySelector('input[type="checkbox"]') as HTMLInputElement).checked).toBe(true);
    });

    it('is unchecked when disabled by default', () => {
      const {container} = renderWithTheme(
        <AerodromeStatusBannerToggle enabled={false} setAerodromeStatusBannerEnabled={jest.fn()}/>
      );
      expect((container.querySelector('input[type="checkbox"]') as HTMLInputElement).checked).toBe(false);
    });

    it('dispatches setAerodromeStatusBannerEnabled with the new value on change', () => {
      const setEnabled = jest.fn();
      const {container} = renderWithTheme(
        <AerodromeStatusBannerToggle enabled={false} setAerodromeStatusBannerEnabled={setEnabled}/>
      );
      fireEvent.click(container.querySelector('input[type="checkbox"]') as HTMLInputElement);
      expect(setEnabled).toHaveBeenCalledWith(true);
    });

    it('disables the checkbox while saving', () => {
      const {container} = renderWithTheme(
        <AerodromeStatusBannerToggle enabled={false} disabled={true} setAerodromeStatusBannerEnabled={jest.fn()}/>
      );
      expect((container.querySelector('input[type="checkbox"]') as HTMLInputElement).disabled).toBe(true);
    });
  });
});
