import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';
import DeleteDialog from '../DeleteDialog';

// At least 130px wide (aligns short entries such as registrations), wider
// for long entries such as e-mail addresses.
const Wrapper = styled.div`
  min-width: 130px;
  width: fit-content;
  max-width: 100%;
  gap: 0.5em;
  font-size: 1.3em;
  margin-bottom: 0.5em;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Name = styled.span`
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

const Item = props => {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <>
      <Wrapper>
        <Name>{props.name}</Name>
        <RemoveButton onClick={() => setConfirmOpen(true)}>
          <MaterialIcon icon="delete"/>
        </RemoveButton>
      </Wrapper>
      {confirmOpen && (
        <DeleteDialog
          question={t('common.deleteConfirm', { name: props.name })}
          onConfirm={() => {
            props.onRemoveClick();
            setConfirmOpen(false);
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
};

Item.propTypes = {
  name: PropTypes.string.isRequired,
  onRemoveClick: PropTypes.func,
};

export default Item;
