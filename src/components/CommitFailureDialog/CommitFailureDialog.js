import React, { PropTypes } from 'react';
import ModalDialog from '../ModalDialog';
import Heading from './Heading';
import ErrorMessage from './ErrorMessage';
import CloseButton from './CloseButton';

const CommitFailureDialog = props => {
  const content = (
    <div>
      <Heading>Speichern fehlgeschlagen</Heading>
      <div>Die Daten konnten nicht gespeichert werden.</div>
      {props.errorMsg && <ErrorMessage>{props.errorMsg}</ErrorMessage>}
      <div>
        <CloseButton label="Schliessen" onClick={props.onClose} flat/>
      </div>
    </div>
  );

  return <ModalDialog content={content} onBlur={props.onClose}/>;
};

CommitFailureDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  errorMsg: PropTypes.string,
};

export default CommitFailureDialog;
