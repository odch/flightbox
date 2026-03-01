import DescriptionText from './DescriptionText'
import QrCodeGenerator from '../QrCodeGenerator'
import LabeledBox from '../LabeledBox'
import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import ClipboardCopier from '../ClipboardCopier'
import { useTranslation } from 'react-i18next';

const LinkBox = styled.div`
  margin: 3rem 0 0 0;
  text-align: center;
`;

const InnerLinkBox = styled.div`
  margin-bottom: 1rem;
`;

const LinkLabel = styled.div`
  font-weight: bold;
  font-size: 1.2em;
  margin-bottom: 0.5rem;
`;

const LinkValue = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
`

const LinkText = styled.div`
  display: flex;
  align-items: center;
`

const StyledLink = styled.a`
  && {
    text-decoration: none;
  }
`

export default function GuestAccessBox({guestAccessToken}) {
  const { t } = useTranslation();
  if (!guestAccessToken || !guestAccessToken.token) {
    return null
  }

  const url = `${window.location.protocol}//${window.location.host}/#/?t=${guestAccessToken.token}`
  const urlOnlyGuest = url + '&guestOnly=true'

  return (
    <LabeledBox label={t('guestAccess.title')}>
      <DescriptionText>
        {t('guestAccess.description')}
      </DescriptionText>
      <QrCodeGenerator url={url}/>
      <LinkBox>
        <InnerLinkBox>
          <LinkLabel>{t('guestAccess.loginLinkFull')}</LinkLabel>
          <LinkValue>
            <LinkText><StyledLink href={url} target="_blank">{url}</StyledLink></LinkText>
            <ClipboardCopier text={url} />
          </LinkValue>
        </InnerLinkBox>
        <InnerLinkBox>
          <LinkLabel>{t('guestAccess.loginLinkGuest')}</LinkLabel>
          <LinkValue>
            <LinkText><StyledLink href={urlOnlyGuest} target="_blank">{urlOnlyGuest}</StyledLink></LinkText>
            <ClipboardCopier text={urlOnlyGuest} />
          </LinkValue>
        </InnerLinkBox>
      </LinkBox>
    </LabeledBox>
  )
}

GuestAccessBox.propTypes = {
  guestAccessToken: PropTypes.shape({
    token: PropTypes.string
  })
}
