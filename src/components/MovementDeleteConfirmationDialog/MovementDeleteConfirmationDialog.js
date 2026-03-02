import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import Button from '../Button';
import ModalDialog from '../ModalDialog';
import dates from '../../util/dates';

const Question = styled.div`
  font-size: 1.5em;
  margin-bottom: 1em;
`;

const Data = styled.div`
  margin-bottom: 1em;
`;

const DataItem = styled.div`
  margin-bottom: 0.3em;
`;

const DialogButton = styled(Button)`
  @media(max-width: 600px) {
    width: 100%;
  }
`;

const DeleteButton = styled(DialogButton)`
  float: right;
  
  @media(max-width: 600px) {
    margin-top: 1em;
    margin-bottom: 1em;
  }
`;

const MovementDeleteConfirmationDialog = props => {
  const { t } = useTranslation();
  const {item, hide, confirm} = props;

  const date = dates.formatDate(item.date);
  const time = dates.formatTime(item.date, item.time);

  const content = (
    <div>
      <Question>{t('movement.deleteConfirm.question')}</Question>
      <Data>
        <DataItem>{t('movement.deleteConfirm.immatriculation')} {item.immatriculation}</DataItem>
        <DataItem>{t('movement.deleteConfirm.pilot')} {item.lastname}</DataItem>
        <DataItem>{t('movement.deleteConfirm.date')} {date}</DataItem>
        <DataItem>{t('movement.deleteConfirm.time')} {time}</DataItem>
      </Data>
      <div>
        <DeleteButton label={t('movement.deleteConfirm.deleteButton')} icon="delete" onClick={() => {
          confirm(item.type, item.key, hide);
        }} danger/>
        <DialogButton label={t('movement.deleteConfirm.cancelButton')} onClick={hide} neutral/>
      </div>
    </div>
  );
  return <ModalDialog content={content} onBlur={hide}/>;
};

MovementDeleteConfirmationDialog.propTypes = {
  item: PropTypes.object.isRequired,
  confirm: PropTypes.func.isRequired,
  hide: PropTypes.func.isRequired,
};

export default MovementDeleteConfirmationDialog;
