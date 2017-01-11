import React from 'react';
import ModalDialog from '../ModalDialog';
import MaterialIcon from '../MaterialIcon';

const ImportDoneDialog = props => {
  const content = (
    <div>
      <div className="heading">{props.doneHeading}</div>
      <div className="message">{props.doneMessage}</div>
      <button className="close" onClick={props.onClose}>
        <MaterialIcon icon="close"/>&nbsp;Schliessen
      </button>
    </div>
  );
  return (
    <ModalDialog
      content={content}
      onBlur={props.onClose}
    />
  );
};

ImportDoneDialog.propTypes = {
  doneHeading: React.PropTypes.string.isRequired,
  doneMessage: React.PropTypes.string.isRequired,
  onClose: React.PropTypes.func.isRequired,
};

export default ImportDoneDialog;
