import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import Button from '../Button';
import ClipboardCopier from '../ClipboardCopier';
import ModalDialog from '../ModalDialog';
import QrCodeGenerator from '../QrCodeGenerator';
import { pprGuestRequestsEnabled } from '../../modules/ppr/access';

const Wrapper = styled.div`
  width: 720px;
  max-width: calc(100vw - 4em);
  max-height: calc(100vh - 6em);
  overflow-y: auto;
  text-align: left;

  @media (max-width: 600px) {
    width: auto;
    max-width: none;
  }
`;

const DialogTitle = styled.h2`
  margin: 0 0 0.25em;
  font-size: 1.5em;
  font-weight: normal;
`;

const Intro = styled.p`
  margin: 0 0 1.25em;
  color: #555;
`;

// One per link: what it does, the link and its QR code
const Card = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1em 1.5em;
  margin-bottom: 1em;
  padding: 1em;
  border: 1px solid #e3e3e3;
  border-radius: 8px;
`;

const CardText = styled.div`
  flex: 1 1 18em;
  min-width: 0;
`;

const CardTitle = styled.h3`
  margin: 0 0 0.25em;
  font-size: 1.1em;
`;

const LinkLine = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5em;
  overflow-wrap: anywhere;
`;

const Help = styled.p`
  margin: 0 0 0.75em;
  color: #666;
  font-size: 0.9em;
  line-height: 1.4;
`;

const QrCode = styled.div`
  flex: 0 0 auto;
  margin: 0 auto;
`;

const Hint = styled.p`
  margin: 0.5em 0 1em;
  color: #666;
  font-size: 0.9em;
  line-height: 1.4;
`;

const Close = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const CloseButton = styled(Button)`
  @media (max-width: 600px) {
    flex: 1 1 100%;
  }
`;

// The app's address, which the PPR emails link to, or else this page's
const appOrigin = () => {
  const appUrl = typeof __CONF__ !== 'undefined' ? __CONF__.appUrl : undefined;
  return (appUrl || window.location.origin).replace(/\/+$/, '');
};

// The short link of the PPR request (src/util/shortLink.ts)
export const loginLink = () => `${appOrigin()}/ppr`;

// With the guest access token, in the fragment like the link of the guest
// access (GuestAccessBox): the browser sends it to no server
export const guestLink = (token: string) => `${appOrigin()}/#/ppr/new?t=${encodeURIComponent(token)}`;

interface WebsiteLinkProps {
  label: string;
  help: string;
  url: string;
  dataCy: string;
}

const WebsiteLink = ({ label, help, url, dataCy }: WebsiteLinkProps) => (
  <Card data-cy={dataCy}>
    <CardText>
      <CardTitle>{label}</CardTitle>
      <Help>{help}</Help>
      <LinkLine>
        <a href={url} target="_blank" rel="noopener noreferrer" data-cy={`${dataCy}-url`}>{url}</a>
        <ClipboardCopier text={url}/>
      </LinkLine>
    </CardText>
    <QrCode>
      <QrCodeGenerator url={url}/>
    </QrCode>
  </Card>
);

interface PprWebsiteLinksProps {
  // The guest access token, which admins read; null without guest access
  guestAccessToken?: string | null;
  onClose: () => void;
}

/**
 * The links to the PPR request for the aerodrome's website and printed
 * notices, in a dialog: with the login, and with the guest access too where
 * guests may request PPR (a guest access token, requests without login, and
 * the email login, whose page offers the guest session). The aerodrome
 * chooses where to use which.
 */
const PprWebsiteLinks = ({ guestAccessToken, onClose }: PprWebsiteLinksProps) => {
  const { t } = useTranslation();
  const emailLogin = typeof __CONF__ !== 'undefined' && __CONF__.loginForm === 'email';
  const withGuestAccess = !!guestAccessToken && pprGuestRequestsEnabled() && emailLogin;
  return (
    <ModalDialog onBlur={onClose} content={
      <Wrapper role="dialog" aria-labelledby="ppr-website-links-title" data-cy="ppr-website-links">
        <DialogTitle id="ppr-website-links-title">{t('ppr.websiteLink.title')}</DialogTitle>
        <Intro>{t('ppr.websiteLink.intro')}</Intro>
        <WebsiteLink
          label={t('ppr.websiteLink.login')}
          help={t('ppr.websiteLink.loginHelp')}
          url={loginLink()}
          dataCy="ppr-website-link"
        />
        {withGuestAccess && (
          <WebsiteLink
            label={t('ppr.websiteLink.guest')}
            help={t('ppr.websiteLink.guestHelp')}
            url={guestLink(guestAccessToken as string)}
            dataCy="ppr-website-guest-link"
          />
        )}
        <Hint>{t('ppr.websiteLink.ownView')}</Hint>
        <Close>
          <CloseButton type="button" icon="close" label={t('common.close')} onClick={onClose} flat dataCy="ppr-website-links-close"/>
        </Close>
      </Wrapper>
    }/>
  );
};

export default PprWebsiteLinks;
