import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';
import DeleteDialog from '../DeleteDialog';

const Wrapper = styled.div`
  width: 130px;
  font-size: 1.3em;
  margin-bottom: 0.5em;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const RemoveButton = styled.button`
  cursor: pointer;
  border: none;
  background: none;
  padding: 0;
  display: flex;
  align-items: center;

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
        <span>{props.name}</span>
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
