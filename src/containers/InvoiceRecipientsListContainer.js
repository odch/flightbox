import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {
  addInvoiceRecipient,
  addInvoiceRecipientEmail,
  loadInvoiceRecipientSettings,
  removeInvoiceRecipient,
  removeInvoiceRecipientEmail
} from '../modules/settings/invoiceRecipients'
import InvoiceRecipientsList from '../components/InvoiceRecipientsList'

class InvoiceRecipientsListContainer extends React.Component {

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

InvoiceRecipientsListContainer.propTypes = {
  invoiceRecipients: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    emails: PropTypes.arrayOf(PropTypes.string).isRequired
  })).isRequired,
  loadInvoiceRecipientSettings: PropTypes.func.isRequired,
  addInvoiceRecipient: PropTypes.func.isRequired,
  addInvoiceRecipientEmail: PropTypes.func.isRequired,
  removeInvoiceRecipient: PropTypes.func.isRequired,
  removeInvoiceRecipientEmail: PropTypes.func.isRequired,
};

const mapStateToProps = (state, ownProps) => {
  return {
    invoiceRecipients: state.settings.invoiceRecipients.recipients || []
  };
};

const mapActionCreators = {
  loadInvoiceRecipientSettings,
  addInvoiceRecipient,
  addInvoiceRecipientEmail,
  removeInvoiceRecipient,
  removeInvoiceRecipientEmail,
};

export default connect(mapStateToProps, mapActionCreators)(InvoiceRecipientsListContainer);
