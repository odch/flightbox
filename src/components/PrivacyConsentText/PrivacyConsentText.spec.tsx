import React from 'react';
import {renderWithTheme} from '../../../test/renderWithTheme';
import PrivacyConsentText from './PrivacyConsentText';

describe('PrivacyConsentText', () => {
  it('should render consent text with privacy policy link', () => {
    const {getByText} = renderWithTheme(
      <PrivacyConsentText privacyPolicyUrl="https://example.com/privacy" />
    );
    const link = getByText('Datenschutzerklärung');
    expect(link.tagName).toEqual('A');
    expect(link).toHaveAttribute('href', 'https://example.com/privacy');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should render nothing when privacyPolicyUrl is null', () => {
    const {container} = renderWithTheme(
      <PrivacyConsentText privacyPolicyUrl={null} />
    );
    expect(container.innerHTML).toEqual('');
  });

  it('should render nothing when privacyPolicyUrl is undefined', () => {
    const {container} = renderWithTheme(
      <PrivacyConsentText />
    );
    expect(container.innerHTML).toEqual('');
  });

  it('should render nothing when privacyPolicyUrl is not a valid http URL', () => {
    const {container} = renderWithTheme(
      <PrivacyConsentText privacyPolicyUrl="javascript:alert(1)" />
    );
    expect(container.innerHTML).toEqual('');
  });
});
