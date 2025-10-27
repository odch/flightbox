import React from 'react';
import LabeledBox from '../../LabeledBox';
import InvoiceRecipientsList from '../../../containers/InvoiceRecipientsListContainer';
import objectToArray from '../../../util/objectToArray';

const AdminInvoiceRecipientsPage = () => {
  const invoicePaymentEnabled = objectToArray(__CONF__.paymentMethods).includes('invoice');

  if (!invoicePaymentEnabled) {
    return (
      <p>Rechnungsfunktion ist nicht aktiviert.</p>
    );
  }

  return (
    <LabeledBox label="Rechnungsempfänger">
      <InvoiceRecipientsList/>
    </LabeledBox>
  );
};

export default AdminInvoiceRecipientsPage;
