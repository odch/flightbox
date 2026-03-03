import React from 'react';
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

class InvoiceRecipientsListContainer extends React.Component<{
  invoiceRecipients: InvoiceRecipient[];
  loadInvoiceRecipientSettings: () => void;
  addInvoiceRecipient: (name: string) => void;
  addInvoiceRecipientEmail: (name: string, email: string) => void;
  removeInvoiceRecipient: (name: string) => void;
  removeInvoiceRecipientEmail: (name: string, email: string) => void;
}> {
  componentWillMount() {
    this.props.loadInvoiceRecipientSettings();
  }

  render() {
    return (
      <InvoiceRecipientsList
        invoiceRecipients={this.props.invoiceRecipients}
        addInvoiceRecipient={this.props.addInvoiceRecipient}
        addInvoiceRecipientEmail={this.props.addInvoiceRecipientEmail}
        removeInvoiceRecipient={this.props.removeInvoiceRecipient}
        removeInvoiceRecipientEmail={this.props.removeInvoiceRecipientEmail}
      />
    );
  }
}

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
