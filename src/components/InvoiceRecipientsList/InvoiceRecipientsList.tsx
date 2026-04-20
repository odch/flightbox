import React, { useEffect, useRef, useState } from 'react'
import MaterialIcon from '../MaterialIcon'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import InvoiceRecipient from './InvoiceRecipient'
import { useTranslation } from 'react-i18next';

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

const InvoiceRecipientsList = (props: any) => {
  const { t } = useTranslation();
  const {
    invoiceRecipients,
    addInvoiceRecipient,
    addInvoiceRecipientEmail,
    removeInvoiceRecipient,
    removeInvoiceRecipientEmail
  } = props;

  const [expandedRecipient, setExpandedRecipient] = useState<string | null>(null);
  const [newRecipientName, setNewRecipientName] = useState('');
  const prevLengthRef = useRef(invoiceRecipients.length);

  useEffect(() => {
    if (prevLengthRef.current < invoiceRecipients.length) {
      setNewRecipientName('');
    }
    prevLengthRef.current = invoiceRecipients.length;
  }, [invoiceRecipients.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addInvoiceRecipient(newRecipientName);
  };

  const sortedRecipients = [...invoiceRecipients].sort((a: any, b: any) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

  return (
    <div>
      <Form onSubmit={handleSubmit}>
        <InputContainer>
          <Input
            type="text"
            value={newRecipientName}
            placeholder={t('invoiceRecipients.nameLabel')}
            onChange={e => setNewRecipientName(e.target.value)}
          />
        </InputContainer>
        <AddButton
          type="submit"
          disabled={newRecipientName.length === 0}
        >
          <MaterialIcon icon="done"/>&nbsp;{t('invoiceRecipients.add')}
        </AddButton>
      </Form>
      <div>
        {sortedRecipients.map((recipient: any) => {
          return (
            <InvoiceRecipient
              key={recipient.name}
              recipient={recipient}
              expanded={expandedRecipient === recipient.name}
              onRemove={() => removeInvoiceRecipient(recipient.name)}
              onAddEmail={(email: string) => addInvoiceRecipientEmail(recipient.name, email)}
              onRemoveEmail={(email: string) => removeInvoiceRecipientEmail(recipient.name, email)}
              onExpandedChange={(expanded: boolean) =>
                setExpandedRecipient(expanded ? recipient.name : null)
              }
            />
          );
        })}
      </div>
    </div>
  );
};

(InvoiceRecipientsList as any).propTypes = {
  invoiceRecipients: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    emails: PropTypes.arrayOf(PropTypes.string).isRequired
  })).isRequired,
  addInvoiceRecipient: PropTypes.func.isRequired,
  addInvoiceRecipientEmail: PropTypes.func.isRequired,
  removeInvoiceRecipient: PropTypes.func.isRequired,
  removeInvoiceRecipientEmail: PropTypes.func.isRequired,
}

export default InvoiceRecipientsList;
