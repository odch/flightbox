import React from 'react';
import LabeledBox from '../../LabeledBox';
import InvoiceRecipientsList from '../../../containers/InvoiceRecipientsListContainer';
import CustomsSyncStatus from '../../../containers/CustomsSyncStatusContainer';
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
      <CustomsSyncStatus statusKey="invoiceRecipients"/>
      <InvoiceRecipientsList/>
    </LabeledBox>
  );
};

export default AdminInvoiceRecipientsPage;
