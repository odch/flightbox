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

const PrivacyConsentText = ({privacyPolicyUrl}: {privacyPolicyUrl?: string | null}) => {
  if (!privacyPolicyUrl || !/^https?:\/\//.test(privacyPolicyUrl)) {
    return null;
  }

  return (
    <StyledText>
      <Trans i18nKey="legal.movementPrivacyConsent">
        Mit dem Speichern akzeptieren Sie die <a href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer">Datenschutzerkl&auml;rung</a>.
      </Trans>
    </StyledText>
  );
};

export default PrivacyConsentText;
