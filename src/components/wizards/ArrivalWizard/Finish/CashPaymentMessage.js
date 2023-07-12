import React from 'react'
import PropTypes from 'prop-types'
import {getFromItemKey} from '../../../../util/reference-number'
import Message from './Message'

const CashPaymentMessage = ({itemKey}) => (
  <Message>
    Bitte deponieren Sie die fällige Landetaxe im Briefkasten vor dem C-Büro und kennzeichnen Sie den Umschlag
    mit der Referenznummer {getFromItemKey(itemKey)}.
  </Message>
)

CashPaymentMessage.propTypes = {
  itemKey: PropTypes.string.isRequired
}
export default CashPaymentMessage
