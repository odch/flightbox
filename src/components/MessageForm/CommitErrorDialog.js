import React from 'react';
import ModalDialog from '../ModalDialog';
import MaterialIcon from '../MaterialIcon';

const CommitErrorDialog = props => {
  const content = (
    <div>
      <div className="heading">Fehler</div>
      <div className="message">Ihre Nachricht konnte nicht gesendet werden.</div>
      <button className="close" onClick={props.onClose}><MaterialIcon icon="close"/>&nbsp;Schliessen</button>
    </div>
  );
  return (
    <ModalDialog
      content={content}
      onBlur={props.onClose}
    />
  );
};

CommitErrorDialog.propTypes = {
  onClose: React.PropTypes.func.isRequired,
};

export default CommitErrorDialog;
