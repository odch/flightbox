import React from 'react'
import PropTypes from 'prop-types'
import {getFromItemKey} from '../../../../util/reference-number'
import Message from './Message'
import { useTranslation } from 'react-i18next';

const CashPaymentMessage = ({itemKey}) => {
  const { t } = useTranslation();
  return (
    <Message>
      {t('arrival.payment.cashMessage', {referenceNumber: getFromItemKey(itemKey)})}
    </Message>
  );
}

CashPaymentMessage.propTypes = {
  itemKey: PropTypes.string.isRequired
}
export default CashPaymentMessage
