import React from 'react'
import Message from './Message'
import { useTranslation } from 'react-i18next';

const CardExternalPaymentMessage = () => {
  const { t } = useTranslation();
  return (
    <Message>
      {t('arrival.payment.cardExternalMessage')}
    </Message>
  );
}

export default CardExternalPaymentMessage
