import PropTypes from 'prop-types';
import React, {useState} from 'react';
import styled from 'styled-components';
import {useTranslation} from 'react-i18next';
import MaterialIcon from '../MaterialIcon';
import SelfDeclarant from './SelfDeclarant';
import {isValidEmail, normalizeEmail} from '../../util/emails';
import {SelfDeclarant as SelfDeclarantData} from '../../util/selfDeclarants';

const ErrorText = styled.p`
  color: ${props => props.theme.colors.danger};
  margin: 0 0 1em 0;
`;

const EmptyText = styled.p`
  color: #666;
`;

const Form = styled.form`
  margin-bottom: 2em;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  border: solid #000;
  border-width: 0 0 1px 0;
  padding: 0.2em;
  font-size: 1.5em;
  margin-right: 1em;
  width: 50%;
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

type ValidationError = 'invalidEmail' | 'duplicateEmail';

interface Props {
  selfDeclarants: SelfDeclarantData[];
  loaded: boolean;
  saveFailed?: boolean;
  addSelfDeclarant: (email: string) => void;
  removeSelfDeclarant: (email: string) => void;
  addAircraft: (email: string, registration: string) => void;
  removeAircraft: (email: string, registration: string) => void;
}

const CustomsSelfDeclarationEmailList = (props: Props) => {
  const {t} = useTranslation();
  const {selfDeclarants, loaded, saveFailed, addSelfDeclarant, removeSelfDeclarant, addAircraft, removeAircraft} = props;

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

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const email = normalizeEmail(newEmail);
    if (!isValidEmail(email)) {
      setValidationError('invalidEmail');
      return;
    }
    if (selfDeclarants.some(selfDeclarant => selfDeclarant.email === email)) {
      setValidationError('duplicateEmail');
      return;
    }
    setValidationError(null);
    addSelfDeclarant(email);
    setNewEmail('');
  };

  const sortedSelfDeclarants = [...selfDeclarants].sort((a, b) => a.email.localeCompare(b.email));

  return (
    <div>
      {validationError && (
        <ErrorText role="alert">{t(`adminCustomsSelfDeclaration.${validationError}`)}</ErrorText>
      )}
      {saveFailed && (
        <ErrorText role="alert">{t('adminCustomsSelfDeclaration.saveFailed')}</ErrorText>
      )}
      <Form onSubmit={add}>
        <Input
          type="email"
          value={newEmail}
          placeholder={t('adminCustomsSelfDeclaration.emailPlaceholder')}
          onChange={e => changeNewEmail(e.target.value)}
        />
        <AddButton type="submit" disabled={newEmail.length === 0}>
          <MaterialIcon icon="done"/>&nbsp;{t('common.add')}
        </AddButton>
      </Form>
      {selfDeclarants.length === 0 && (
        <EmptyText>{t('adminCustomsSelfDeclaration.empty')}</EmptyText>
      )}
      {sortedSelfDeclarants.map(selfDeclarant => (
        <SelfDeclarant
          key={selfDeclarant.email}
          selfDeclarant={selfDeclarant}
          onRemove={() => removeSelfDeclarant(selfDeclarant.email)}
          onAddAircraft={registration => addAircraft(selfDeclarant.email, registration)}
          onRemoveAircraft={registration => removeAircraft(selfDeclarant.email, registration)}
        />
      ))}
    </div>
  );
};

CustomsSelfDeclarationEmailList.propTypes = {
  selfDeclarants: PropTypes.arrayOf(PropTypes.shape({
    email: PropTypes.string.isRequired,
    registrations: PropTypes.arrayOf(PropTypes.string).isRequired,
  })).isRequired,
  loaded: PropTypes.bool.isRequired,
  saveFailed: PropTypes.bool,
  addSelfDeclarant: PropTypes.func.isRequired,
  removeSelfDeclarant: PropTypes.func.isRequired,
  addAircraft: PropTypes.func.isRequired,
  removeAircraft: PropTypes.func.isRequired,
};

export default CustomsSelfDeclarationEmailList;
