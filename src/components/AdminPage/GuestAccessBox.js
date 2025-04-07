import DescriptionText from './DescriptionText'
import QrCodeGenerator from '../QrCodeGenerator'
import LabeledBox from '../LabeledBox'
import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import ClipboardCopier from '../ClipboardCopier'

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
  if (!guestAccessToken || !guestAccessToken.token) {
    return null
  }

  const url = `${window.location.protocol}//${window.location.host}/#/?t=${guestAccessToken.token}`
  const urlOnlyGuest = url + '&guestOnly=true'

  return (
    <LabeledBox label="Gast-Login">
      <DescriptionText>
        Das Gast-Login per QR-Code ist aktiv. Dieser QR-Code kann auf dem Flugplatz ausgelegt werden, um Piloten
        den Gast-Zugang zur Verfügung zu stellen.
      </DescriptionText>
      <QrCodeGenerator url={url}/>
      <LinkBox>
        <InnerLinkBox>
          <LinkLabel>Login-Link (E-Mail oder Gast):</LinkLabel>
          <LinkValue>
            <LinkText><StyledLink href={url} target="_blank">{url}</StyledLink></LinkText>
            <ClipboardCopier text={url} />
          </LinkValue>
        </InnerLinkBox>
        <InnerLinkBox>
          <LinkLabel>Login-Link (nur Gast):</LinkLabel>
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
