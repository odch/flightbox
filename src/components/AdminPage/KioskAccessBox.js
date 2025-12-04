import DescriptionText from './DescriptionText'
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

export default function KioskAccessBox({kioskAccessToken}) {
  if (!kioskAccessToken || !kioskAccessToken.token) {
    return null
  }

  const url = `${window.location.protocol}//${window.location.host}?kt=${kioskAccessToken.token}`

  return (
    <LabeledBox label="Kiosk-Login">
      <DescriptionText>
        Das Kiosk-Login ist aktiv. Dieser Link kann für öffentlich zugängliche Flightbox-Terminals verwendet werden.
      </DescriptionText>
      <LinkBox>
        <InnerLinkBox>
          <LinkLabel>Kiosk-Link:</LinkLabel>
          <LinkValue>
            <LinkText><StyledLink href={url} target="_blank">{url}</StyledLink></LinkText>
            <ClipboardCopier text={url} />
          </LinkValue>
        </InnerLinkBox>
      </LinkBox>
    </LabeledBox>
  )
}

KioskAccessBox.propTypes = {
  kioskAccessToken: PropTypes.shape({
    token: PropTypes.string
  })
}
