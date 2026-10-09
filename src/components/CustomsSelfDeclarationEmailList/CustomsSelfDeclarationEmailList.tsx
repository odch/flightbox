import PropTypes from 'prop-types';
import React, {useState} from 'react';
import styled from 'styled-components';
import {useTranslation} from 'react-i18next';
import ItemList from '../ItemList';
import {isValidEmail, normalizeEmail} from '../../util/emails';

const ErrorText = styled.p`
  color: ${props => props.theme.colors.danger};
  margin: 0 0 1em 0;
`;

const EmptyText = styled.p`
  color: #666;
`;

type ValidationError = 'invalidEmail' | 'duplicateEmail';

interface Props {
  emails: string[];
  loaded: boolean;
  saveFailed?: boolean;
  addEmail: (email: string) => void;
  removeEmail: (email: string) => void;
}

const CustomsSelfDeclarationEmailList = (props: Props) => {
  const {t} = useTranslation();
  const {emails, loaded, saveFailed, addEmail, removeEmail} = props;

  const [newEmail, setNewEmail] = useState('');
  const [validationError, setValidationError] = useState<ValidationError | null>(null);

  // Nothing can be added before the stored list arrived, so a change is
  // never based on an empty initial state.
  if (!loaded) {
    return <p>{t('common.loading')}</p>;
  }

  const changeNewEmail = (value: string) => {
    setNewEmail(value);
    setValidationError(null);
  };

  const add = (value: string) => {
    const email = normalizeEmail(value);
    if (!isValidEmail(email)) {
      setValidationError('invalidEmail');
      return;
    }
    if (emails.includes(email)) {
      setValidationError('duplicateEmail');
      return;
    }
    setValidationError(null);
    addEmail(email);
    setNewEmail('');
  };

  const sortedEmails = [...emails].sort((a, b) => a.localeCompare(b));

  return (
    <div>
      {validationError && (
        <ErrorText role="alert">{t(`adminCustomsSelfDeclaration.${validationError}`)}</ErrorText>
      )}
      {saveFailed && (
        <ErrorText role="alert">{t('adminCustomsSelfDeclaration.saveFailed')}</ErrorText>
      )}
      <ItemList
        items={sortedEmails}
        newItem={newEmail}
        newItemInputType="email"
        placeholder={t('adminCustomsSelfDeclaration.emailPlaceholder')}
        changeNewItem={changeNewEmail}
        addItem={add}
        removeItem={removeEmail}
      />
      {emails.length === 0 && (
        <EmptyText>{t('adminCustomsSelfDeclaration.empty')}</EmptyText>
      )}
    </div>
  );
};

CustomsSelfDeclarationEmailList.propTypes = {
  emails: PropTypes.arrayOf(PropTypes.string).isRequired,
  loaded: PropTypes.bool.isRequired,
  saveFailed: PropTypes.bool,
  addEmail: PropTypes.func.isRequired,
  removeEmail: PropTypes.func.isRequired,
};

export default CustomsSelfDeclarationEmailList;
