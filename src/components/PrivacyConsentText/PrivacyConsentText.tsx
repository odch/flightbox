import React from 'react';
import { Trans } from 'react-i18next';
import styled from 'styled-components';

const StyledText = styled.p`
  padding: 0 20px;
  font-size: 0.85em;
  color: #666;

  a {
    color: #666;
    text-decoration: underline;
  }
`;

interface PrivacyConsentTextProps {
  privacyPolicyUrl?: string | null;
  // A text with the link as <1>…</1>, for another action than saving
  i18nKey?: string;
  className?: string;
}

const PrivacyConsentText = ({privacyPolicyUrl, i18nKey = 'legal.movementPrivacyConsent', className}: PrivacyConsentTextProps) => {
  if (!privacyPolicyUrl || !/^https?:\/\//.test(privacyPolicyUrl)) {
    return null;
  }

  return (
    <StyledText className={className}>
      <Trans i18nKey={i18nKey}>
        Mit dem Speichern akzeptieren Sie die <a href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer">Datenschutzerkl&auml;rung</a>.
      </Trans>
    </StyledText>
  );
};

export default PrivacyConsentText;
