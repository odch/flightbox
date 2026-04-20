import React, { useEffect } from 'react';
import {connect} from 'react-redux';
import {
  addInvoiceRecipient,
  addInvoiceRecipientEmail,
  loadInvoiceRecipientSettings,
  removeInvoiceRecipient,
  removeInvoiceRecipientEmail,
} from '../modules/settings/invoiceRecipients';
import InvoiceRecipientsList from '../components/InvoiceRecipientsList';
import {RootState} from '../modules';

interface InvoiceRecipient {
  name: string;
  emails: string[];
}

interface Props {
  invoiceRecipients: InvoiceRecipient[];
  loadInvoiceRecipientSettings: () => void;
  addInvoiceRecipient: (name: string) => void;
  addInvoiceRecipientEmail: (name: string, email: string) => void;
  removeInvoiceRecipient: (name: string) => void;
  removeInvoiceRecipientEmail: (name: string, email: string) => void;
}

const InvoiceRecipientsListContainer = (props: Props) => {
  useEffect(() => {
    props.loadInvoiceRecipientSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <InvoiceRecipientsList
      invoiceRecipients={props.invoiceRecipients}
      addInvoiceRecipient={props.addInvoiceRecipient}
      addInvoiceRecipientEmail={props.addInvoiceRecipientEmail}
      removeInvoiceRecipient={props.removeInvoiceRecipient}
      removeInvoiceRecipientEmail={props.removeInvoiceRecipientEmail}
    />
  );
};

const mapStateToProps = (state: RootState) => ({
  invoiceRecipients: state.settings.invoiceRecipients.recipients || [],
});

const mapActionCreators = {
  loadInvoiceRecipientSettings,
  addInvoiceRecipient,
  addInvoiceRecipientEmail,
  removeInvoiceRecipient,
  removeInvoiceRecipientEmail,
};

export default connect(mapStateToProps, mapActionCreators)(InvoiceRecipientsListContainer as any);
