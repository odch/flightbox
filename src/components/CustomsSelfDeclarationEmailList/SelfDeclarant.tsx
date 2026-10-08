import PropTypes from 'prop-types';
import React, {useState} from 'react';
import styled from 'styled-components';
import {useTranslation} from 'react-i18next';
import MaterialIcon from '../MaterialIcon';
import Item from '../ItemList/Item';
import DeleteDialog from '../DeleteDialog';
import AircraftDropdown, {AircraftDropdownValue} from '../../containers/AircraftDropdownContainer';
import {isValidRegistration, normalizeRegistration, SelfDeclarant as SelfDeclarantData} from '../../util/selfDeclarants';

const Wrapper = styled.div`
  margin-bottom: 1rem;
  border: 1px solid #eee;
`;

const Header = styled.div`
  font-size: 1.3em;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
`;

const Email = styled.div`
  overflow-wrap: anywhere;
`;

const RemoveButton = styled.button`
  cursor: pointer;
  border: none;
  background: none;
  padding: 0;
  display: flex;
  align-items: center;
  flex-shrink: 0;

  &:hover {
    color: ${props => props.theme.colors.main};
  }
`;

const Details = styled.div`
  padding: 0 1rem 1rem 1rem;
`;

const Caption = styled.div`
  color: #666;
  margin-bottom: 0.5em;
`;

const NoAircraftHint = styled.p`
  color: ${props => props.theme.colors.danger};
  display: flex;
  gap: 0.5em;
  align-items: flex-start;
  margin: 0 0 1em 0;
`;

const ErrorText = styled.p`
  color: ${props => props.theme.colors.danger};
  margin: 0 0 0.5em 0;
`;

const AddAircraftRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1em;
  margin-top: 1em;
`;

const DropdownContainer = styled.div`
  flex: 1 1 150px;
  max-width: 300px;
  font-size: 1.5em;
`;

const AddButton = styled.button`
  border: none;
  background: none;
  font-size: 1.3em;
  cursor: pointer;
  display: flex;
  align-items: center;

  &:hover {
    color: ${props => props.theme.colors.main};
  }
`;

type ValidationError = 'invalidRegistration' | 'duplicateRegistration';

interface Props {
  selfDeclarant: SelfDeclarantData;
  onRemove: () => void;
  onAddAircraft: (registration: string) => void;
  onRemoveAircraft: (registration: string) => void;
}

const noop = () => undefined;

const SelfDeclarant = (props: Props) => {
  const {t} = useTranslation();
  const {selfDeclarant, onRemove, onAddAircraft, onRemoveAircraft} = props;

  const [registration, setRegistration] = useState('');
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Called with the selected aircraft, or with `{key}` holding the typed
  // registration when it matches none of the options (free entry). The
  // dropdown hands a typed registration over when its input loses focus,
  // which happens before the click on the add button.
  const changeRegistration = (aircraft: AircraftDropdownValue | null | undefined) => {
    setRegistration(normalizeRegistration(aircraft?.key ?? ''));
    setValidationError(null);
  };

  const addAircraft = () => {
    const value = normalizeRegistration(registration);
    if (!isValidRegistration(value)) {
      setValidationError('invalidRegistration');
      return;
    }
    if (selfDeclarant.registrations.includes(value)) {
      setValidationError('duplicateRegistration');
      return;
    }
    setValidationError(null);
    onAddAircraft(value);
    setRegistration('');
  };

  const sortedRegistrations = [...selfDeclarant.registrations].sort((a, b) => a.localeCompare(b));

  return (
    <>
      <Wrapper data-testid="self-declarant">
        <Header>
          <Email>{selfDeclarant.email}</Email>
          <RemoveButton
            type="button"
            aria-label={t('adminCustomsSelfDeclaration.removePerson')}
            title={t('adminCustomsSelfDeclaration.removePerson')}
            onClick={() => setDeleteDialogOpen(true)}
          >
            <MaterialIcon icon="delete"/>
          </RemoveButton>
        </Header>
        <Details>
          <Caption>{t('adminCustomsSelfDeclaration.aircraft')}</Caption>
          {sortedRegistrations.length === 0 && (
            <NoAircraftHint>
              <MaterialIcon icon="warning"/>
              <span>{t('adminCustomsSelfDeclaration.noAircraft')}</span>
            </NoAircraftHint>
          )}
          {sortedRegistrations.map(item => (
            <Item
              key={item}
              name={item}
              onRemoveClick={() => onRemoveAircraft(item)}
            />
          ))}
          <AddAircraftRow>
            <DropdownContainer>
              <AircraftDropdown
                value={registration}
                onChange={changeRegistration}
                onFocus={noop}
                onBlur={noop}
                clearable
              />
            </DropdownContainer>
            <AddButton type="button" onClick={addAircraft}>
              <MaterialIcon icon="done"/>&nbsp;{t('adminCustomsSelfDeclaration.addAircraft')}
            </AddButton>
          </AddAircraftRow>
          {validationError && (
            <ErrorText role="alert">{t(`adminCustomsSelfDeclaration.${validationError}`)}</ErrorText>
          )}
        </Details>
      </Wrapper>
      {deleteDialogOpen && (
        <DeleteDialog
          question={t('adminCustomsSelfDeclaration.removePersonConfirm', {email: selfDeclarant.email})}
          onConfirm={() => {
            setDeleteDialogOpen(false);
            onRemove();
          }}
          onCancel={() => setDeleteDialogOpen(false)}
        />
      )}
    </>
  );
};

SelfDeclarant.propTypes = {
  selfDeclarant: PropTypes.shape({
    email: PropTypes.string.isRequired,
    registrations: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  onRemove: PropTypes.func.isRequired,
  onAddAircraft: PropTypes.func.isRequired,
  onRemoveAircraft: PropTypes.func.isRequired,
};

export default SelfDeclarant;
