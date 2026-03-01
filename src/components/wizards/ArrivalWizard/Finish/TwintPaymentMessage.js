import React from 'react'
import Message from './Message'
import { useTranslation } from 'react-i18next';

const TwintPaymentMessage = () => {
  const { t } = useTranslation();
  return (
    <Message>
      {t('arrival.payment.twintMessage')}
    </Message>
  );
}

export default TwintPaymentMessage
