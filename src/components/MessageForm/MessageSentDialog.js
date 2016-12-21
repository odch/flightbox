import React from 'react';
import ModalDialog from '../ModalDialog';
import MaterialIcon from '../MaterialIcon';

const MessageSentDialog = props => {
  const content = (
    <div>
      <div className="heading">Nachricht gesendet</div>
      <div className="message">Vielen Dank! Ihre Nachricht wurde gesendet.</div>
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

MessageSentDialog.propTypes = {
  onClose: React.PropTypes.func.isRequired,
};

export default MessageSentDialog;
