import DescriptionText from './DescriptionText'
import QrCodeGenerator from '../QrCodeGenerator'
import LabeledBox from '../LabeledBox'
import React from 'react'
import PropTypes from 'prop-types'

export default function GuestAccessBox({guestAccessToken}) {
  if (!guestAccessToken || !guestAccessToken.token) {
    return null
  }

  const url = `${window.location.protocol}//${window.location.host}/#/?t=${guestAccessToken.token}`

  return (
    <LabeledBox label="Gast-Login">
      <DescriptionText>
        Das Gast-Login per QR-Code ist aktiv. Dieser QR-Code kann auf dem Flugplatz ausgelegt werden, um Piloten
        den Gast-Zugang zur Verfügung zu stellen.
      </DescriptionText>
      <QrCodeGenerator url={url}/>
    </LabeledBox>
  )
}

GuestAccessBox.propTypes = {
  guestAccessToken: PropTypes.shape({
    token: PropTypes.string
  })
}
