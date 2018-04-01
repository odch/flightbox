import PropTypes from 'prop-types';
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

const Dialog = props => {
  const content = (
    <div>
      <Heading>{props.heading}</Heading>
      <Message>{props.message}</Message>
      <CloseButton type="button" icon="close" label="Schliessen" onClick={props.onClose} flat/>
    </div>
  );
  return <ModalDialog content={content}/>;
};

Dialog.propTypes = {
  heading: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

export default Dialog;
