import PropTypes from 'prop-types';
import React from 'react';
import Mask from './Mask';
import Content from './Content';

const handleMaskClick = onBlur => {
  if (typeof onBlur === 'function') {
    onBlur();
  }
};

const ModalDialog = props => (
  <div>
    <Mask onClick={handleMaskClick.bind(null, props.onBlur)}/>
    <Content $fullWidthThreshold={props.fullWidthThreshold}>{props.content}</Content>
  </div>
);

ModalDialog.propTypes = {
  content: PropTypes.element.isRequired,
  onBlur: PropTypes.func,
  fullWidthThreshold: PropTypes.number
};

ModalDialog.defaultProps = {
  fullWidthThreshold: 600
};

export default ModalDialog;
