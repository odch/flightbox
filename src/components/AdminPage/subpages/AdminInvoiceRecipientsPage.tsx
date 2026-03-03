import React from 'react';
import LabeledBox from '../../LabeledBox';
import InvoiceRecipientsList from '../../../containers/InvoiceRecipientsListContainer';
import objectToArray from '../../../util/objectToArray';
import { useTranslation } from 'react-i18next';

const AdminInvoiceRecipientsPage = () => {
  const { t } = useTranslation();
  const invoicePaymentEnabled = objectToArray(__CONF__.paymentMethods).includes('invoice');

  if (!invoicePaymentEnabled) {
    return (
      <p>{t('adminInvoiceRecipients.notActivated')}</p>
    );
  }

  return (
    <LabeledBox label={t('adminInvoiceRecipients.title')}>
      <InvoiceRecipientsList/>
    </LabeledBox>
  );
};

export default AdminInvoiceRecipientsPage;
