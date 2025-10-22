import React from 'react'
import MaterialIcon from '../MaterialIcon'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import InvoiceRecipient from './InvoiceRecipient'

const Form = styled.form`
    margin-bottom: 2em;
    display: flex;
`;

const InputContainer = styled.div`
    flex-grow: 1;
    padding-right: 1em;
`

const Input = styled.input`
    border: solid #000;
    border-width: 0 0 1px 0;
    padding: 0.2em;
    font-size: 1.5em;
    width:100%;
`;

const AddButton = styled.button`
    border: none;
    background: none;
    font-size: 1.3em;

    ${props => props.disabled !== true && `cursor: pointer;`}
    &:hover {
        ${props => props.disabled !== true && `color: ${props.theme.colors.main};`}
    }
`;

class InvoiceRecipientsList extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      expandedRecipient: null,
      newRecipientName: ''
    }
  }

  componentDidUpdate(prevProps) {
    // Check if a new recipient was successfully added
    if (prevProps.invoiceRecipients.length < this.props.invoiceRecipients.length) {
      this.setState({newRecipientName: ''});
    }
  }

  render() {
    const {
      invoiceRecipients,
      addInvoiceRecipient,
      addInvoiceRecipientEmail,
      removeInvoiceRecipient,
      removeInvoiceRecipientEmail
    } = this.props

    const handleSubmit = e => {
      e.preventDefault()
      addInvoiceRecipient(this.state.newRecipientName)
    }

    const sortedRecipients = [...invoiceRecipients].sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    )

    return (
      <div>
        <Form onSubmit={handleSubmit}>
          <InputContainer>
            <Input
              type="text"
              value={this.state.newRecipientName}
              placeholder="Name des Rechnungsempfängers (z.B. 'Flugschule XYZ')"
              onChange={e => this.setState({
                newRecipientName: e.target.value
              })}
            />
          </InputContainer>
          <AddButton
            type="submit"
            disabled={this.state.newRecipientName.length === 0}
          >
            <MaterialIcon icon="done"/>&nbsp;Hinzufügen
          </AddButton>
        </Form>
        <div>
          {sortedRecipients.map((recipient) => {
            return (
              <InvoiceRecipient
                key={recipient.name}
                recipient={recipient}
                expanded={this.state.expandedRecipient === recipient.name}
                onRemove={() => removeInvoiceRecipient(recipient.name)}
                onAddEmail={email => addInvoiceRecipientEmail(recipient.name, email)}
                onRemoveEmail={email => removeInvoiceRecipientEmail(recipient.name, email)}
                onExpandedChange={expanded => this.setState({
                  expandedRecipient: expanded ? recipient.name : null
                })}
              />
            );
          })}
        </div>
      </div>
    )
  }
}

InvoiceRecipientsList.propTypes = {
  invoiceRecipients: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    emails: PropTypes.arrayOf(PropTypes.string).isRequired
  })).isRequired,
  addInvoiceRecipient: PropTypes.func.isRequired,
  addInvoiceRecipientEmail: PropTypes.func.isRequired,
  removeInvoiceRecipient: PropTypes.func.isRequired,
  removeInvoiceRecipientEmail: PropTypes.func.isRequired,
}

export default InvoiceRecipientsList
