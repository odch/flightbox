import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';
import ItemList from '../ItemList'
import Button from '../Button'
import DeleteDialog from './DeleteDialog'

const Wrapper = styled.div`
  margin-bottom: 1rem;
  border: 1px solid #eee;
`

const Header = styled.div`
  font-size: 1.3em;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem;
`;

const Name = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`

const Details = styled.div`
  padding: 1rem;
  font-size: 0.8em;
`

const ButtonContainer = styled.div`
  text-align: right
`

const InvoiceRecipient = (props: any) => {
  const { t } = useTranslation();
  const { recipient, expanded, onRemove, onAddEmail, onRemoveEmail, onExpandedChange } = props;

  const [newEmail, setNewEmail] = useState('');
  const [recipientDeleteDialogOpen, setRecipientDeleteDialogOpen] = useState(false);

  const currentEmails = recipient.emails || [];
  const prevEmailsLengthRef = useRef(currentEmails.length);

  useEffect(() => {
    if (prevEmailsLengthRef.current < currentEmails.length) {
      setNewEmail('');
    }
    prevEmailsLengthRef.current = currentEmails.length;
  }, [currentEmails.length]);

  const sortedEmails = [...currentEmails].sort((a: string, b: string) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  return (
    <>
      <Wrapper>
        <Header onClick={() => onExpandedChange(!expanded)}>
          <Name>
            <MaterialIcon icon={expanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}/>
            <div>{recipient.name}</div>
          </Name>
        </Header>
        {expanded && (
          <Details>
            <ItemList items={sortedEmails}
                      placeholder={t('invoiceRecipients.authorizedLogin')}
                      newItem={newEmail}
                      newItemInputType="email"
                      changeNewItem={(value: string) => setNewEmail(value)}
                      addItem={onAddEmail}
                      removeItem={onRemoveEmail}/>
            <ButtonContainer>
              <Button
                label={t('invoiceRecipients.delete')}
                icon="delete"
                danger
                onClick={() => setRecipientDeleteDialogOpen(true)}
              />
            </ButtonContainer>
          </Details>
        )}
      </Wrapper>
      {recipientDeleteDialogOpen && (
        <DeleteDialog
          question={t('invoiceRecipients.deleteConfirm', {name: recipient.name})}
          onConfirm={() => onRemove()}
          onCancel={() => setRecipientDeleteDialogOpen(false)}
        />
      )}
    </>
  );
};

(InvoiceRecipient as any).propTypes = {
  recipient: PropTypes.shape({
    name: PropTypes.string.isRequired,
    emails: PropTypes.arrayOf(PropTypes.string)
  }),
  onRemove: PropTypes.func,
  onAddEmail: PropTypes.func,
  onRemoveEmail: PropTypes.func,
  onExpandedChange: PropTypes.func,
};

export default InvoiceRecipient;
