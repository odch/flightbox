import PropTypes from 'prop-types';
import React, { Component } from 'react';
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
  const {item, hide, confirm} = props;

  const date = dates.formatDate(item.date);
  const time = dates.formatTime(item.date, item.time);

  const content = (
    <div>
      <Question>Möchten Sie diese Bewegung wirklich löschen?</Question>
      <Data>
        <DataItem>Immatrikulation: {item.immatriculation}</DataItem>
        <DataItem>Pilot: {item.lastname}</DataItem>
        <DataItem>Datum: {date}</DataItem>
        <DataItem>Uhrzeit: {time}</DataItem>
      </Data>
      <div>
        <DeleteButton label="Bewegung löschen" icon="delete" onClick={() => {
          confirm(item.type, item.key, hide);
        }} danger/>
        <DialogButton label="Abbrechen" onClick={hide} neutral/>
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
