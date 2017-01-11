import React, { PropTypes } from 'react';
import ModalDialog from '../ModalDialog';
import './CommitFailureDialog.scss';

const CommitFailureDialog = props => {
  const content = (
    <div className="CommitFailureDialog">
      <div className="heading">Speichern fehlgeschlagen</div>
      <div className="msg">Die Daten konnten nicht gespeichert werden.</div>
      {props.errorMsg && <div className="error-msg">{props.errorMsg}</div>}
      <div className="actions">
        <button className="close" onClick={props.onClose}>Schliessen</button>
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
