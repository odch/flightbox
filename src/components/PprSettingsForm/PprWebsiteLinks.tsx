import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import ClipboardCopier from '../ClipboardCopier';
import MaterialIcon from '../MaterialIcon';
import QrCodeGenerator from '../QrCodeGenerator';
import { pprGuestRequestsEnabled } from '../../modules/ppr/access';

const Links = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1em;
`;

const LinkLabel = styled.div`
  font-weight: 600;
`;

const LinkLine = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5em;
  overflow-wrap: anywhere;
`;

const Help = styled.p`
  margin: 0.25em 0 0;
  color: #666;
  font-size: 0.9em;
  line-height: 1.4;
`;

const QrCodeToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25em;
  margin-top: 0.25em;
  padding: 0.25em 0;
  border: 0;
  background: none;
  color: ${props => props.theme.colors.main};
  font: inherit;
  font-size: 0.9em;
  cursor: pointer;
`;

// The icon font's ligature is a word: not for screen readers
const ToggleIcon = styled.span`
  display: flex;
`;

// The code is centred in its own width, which keeps it at the left like the
// rest of the summary
const QrCode = styled.div`
  display: inline-block;
  margin-top: 0.5em;
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

// A link with its copy button, and its QR code for printed notices on
// request: the summary stays short
const WebsiteLink = ({ label, help, url, dataCy }: WebsiteLinkProps) => {
  const { t } = useTranslation();
  const [qrCodeShown, setQrCodeShown] = useState(false);
  return (
    <div data-cy={dataCy}>
      <LinkLabel>{label}</LinkLabel>
      <LinkLine>
        <a href={url} target="_blank" rel="noopener noreferrer" data-cy={`${dataCy}-url`}>{url}</a>
        <ClipboardCopier text={url}/>
      </LinkLine>
      <Help>{help}</Help>
      <QrCodeToggle
        type="button"
        aria-expanded={qrCodeShown}
        onClick={() => setQrCodeShown(!qrCodeShown)}
        data-cy={`${dataCy}-qr-toggle`}
      >
        <ToggleIcon aria-hidden="true"><MaterialIcon icon={qrCodeShown ? 'expand_less' : 'expand_more'} size={18}/></ToggleIcon>
        {t(qrCodeShown ? 'ppr.websiteLink.hideQrCode' : 'ppr.websiteLink.showQrCode')}
      </QrCodeToggle>
      {qrCodeShown && (
        <div>
          <QrCode>
            <QrCodeGenerator url={url}/>
          </QrCode>
        </div>
      )}
    </div>
  );
};

interface PprWebsiteLinksProps {
  // The guest access token, which admins read; null without guest access
  guestAccessToken?: string | null;
}

/**
 * The links to the PPR request for the aerodrome's website and printed
 * notices: with the login, and with the guest access too where guests may
 * request PPR (a guest access token, requests without login, and the email
 * login, whose page offers the guest session). The aerodrome chooses where
 * to use which.
 */
const PprWebsiteLinks = ({ guestAccessToken }: PprWebsiteLinksProps) => {
  const { t } = useTranslation();
  const emailLogin = typeof __CONF__ !== 'undefined' && __CONF__.loginForm === 'email';
  const withGuestAccess = !!guestAccessToken && pprGuestRequestsEnabled() && emailLogin;
  return (
    <Links>
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
      <Help>{t('ppr.websiteLink.ownView')}</Help>
    </Links>
  );
};

export default PprWebsiteLinks;
