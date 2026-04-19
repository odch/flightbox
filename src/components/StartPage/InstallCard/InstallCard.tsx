import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Button from '../../Button';
import { usePwaInstall, AuthData } from './usePwaInstall';

const Wrapper = styled.div`
  border-radius: 10px;
  background-color: ${props => props.theme.colors.background};
  padding: 1em;
  flex: 1 1 300px;
  min-width: 280px;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const Title = styled.h3`
  color: ${props => props.theme.colors.main};
  margin: 0 0 0.5em;
  font-size: 1.1em;
`;

const Description = styled.p`
  margin: 0 0 1em;
  font-size: 0.95em;
  line-height: 1.4;
`;

const DismissLink = styled.button`
  background: none;
  border: none;
  color: #999;
  font-size: 0.85em;
  cursor: pointer;
  margin-top: auto;
  padding: 1.5em 0 0;
  display: block;
`;

const Instructions = styled(Description)`
  margin-bottom: 0.5em;
`;

const ShareIcon = () => (
  <svg
    data-testid="share-icon"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ verticalAlign: 'middle', margin: '0 0.2em' }}
  >
    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

interface InstallCardProps {
  authData: AuthData;
}

const InstallCard: React.FC<InstallCardProps> = ({ authData }) => {
  const { t } = useTranslation();
  const { shouldShow, platform, nextDismissIsPermanent, install, dismiss } = usePwaInstall(authData);

  if (!shouldShow) return null;

  return (
    <Wrapper data-testid="install-card">
      <Title>{t('pwaInstall.title')}</Title>
      <Description>{t('pwaInstall.description')}</Description>
      {platform === 'chromium' && (
        <Button
          type="button"
          label={t('pwaInstall.installButton')}
          onClick={install}
          primary
          dataCy="install-button"
        />
      )}
      {platform === 'ios-safari' && (
        <Instructions data-testid="ios-instructions">
          {t('pwaInstall.iosInstructionsPre')}<ShareIcon />{t('pwaInstall.iosInstructionsPost')}
        </Instructions>
      )}
      {platform === 'macos-safari' && (
        <Instructions data-testid="macos-instructions">
          {t('pwaInstall.macosInstructionsPre')}<ShareIcon />{t('pwaInstall.macosInstructionsPost')}
        </Instructions>
      )}
      <DismissLink onClick={dismiss} data-testid="dismiss-link">
        {nextDismissIsPermanent ? t('pwaInstall.dismissPermanent') : t('pwaInstall.dismiss')}
      </DismissLink>
    </Wrapper>
  );
};

export default InstallCard;
