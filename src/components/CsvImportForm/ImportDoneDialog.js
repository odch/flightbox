import React from 'react';
import styled from 'styled-components';
import ModalDialog from '../ModalDialog';
import Button from '../Button';

const Heading = styled.div`
  font-size: 1.5em;
  margin-bottom: 1em;
`;

const Message = styled.div`
  margin-bottom: 1em;
`;

const CloseButton = styled(Button)`
  float: right;
`;

const ImportDoneDialog = props => {
  const content = (
    <div>
      <Heading>{props.doneHeading}</Heading>
      <Message>{props.doneMessage}</Message>
      <CloseButton label="Schliessen" icon="close" onClick={props.onClose}/>
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
