import React from 'react'
import PropTypes from 'prop-types'
import {getFromItemKey} from '../../../../util/reference-number'
import Message from './Message'

const TwintPaymentMessage = ({itemKey}) => (
  <Message>
    Bitte überweisen Sie die fällige Landetaxe über den ausliegenden TWINT QR-Code und geben Sie die Referenznummer {getFromItemKey(itemKey)} als Zahlungszweck an.
  </Message>
)

TwintPaymentMessage.propTypes = {
  itemKey: PropTypes.string.isRequired
}
export default TwintPaymentMessage
