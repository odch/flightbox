import React, {PropTypes, Component} from 'react';
import Mask from './Mask';
import Content from './Content';

const handleMaskClick = onBlur => {
  if (typeof onBlur === 'function') {
    onBlur();
  }
};

const ModalDialog = props => (
  <div>
    <Mask onClick={handleMaskClick.bind(props.onBlur)}/>
    <Content>{props.content}</Content>
  </div>
);

ModalDialog.propTypes = {
  content: PropTypes.element.isRequired,
  onBlur: PropTypes.func,
};

export default ModalDialog;
