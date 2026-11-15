import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import LabeledBox from '../LabeledBox';
import ClipboardCopier from '../ClipboardCopier';
import QrCodeGenerator from '../QrCodeGenerator';

const Link = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5em;
  margin-bottom: 1em;
  overflow-wrap: anywhere;
`;

// The code is centred in its own width, which keeps it at the left like the
// rest of the tab
const QrCode = styled.div`
  display: inline-block;
`;

// The short link on the origin the PPR emails link to: it opens the PPR
// request (src/util/shortLink.ts), with or without login
const websiteLink = () => `${(__CONF__.appUrl || window.location.origin).replace(/\/+$/, '')}/ppr`;

// For the aerodrome's website and printed notices
const PprWebsiteLinkBox = () => {
  const { t } = useTranslation();
  const url = websiteLink();
  return (
    <LabeledBox label={t('ppr.websiteLink.title')} className="ppr-website-link">
      <p>{t('ppr.websiteLink.description')}</p>
      <Link>
        <a href={url} target="_blank" rel="noopener noreferrer" data-cy="ppr-website-link">{url}</a>
        <ClipboardCopier text={url}/>
      </Link>
      <p>{t('ppr.websiteLink.ownView')}</p>
      <QrCode>
        <QrCodeGenerator url={url}/>
      </QrCode>
    </LabeledBox>
  );
};

export default PprWebsiteLinkBox;
