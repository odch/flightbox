import PropTypes from 'prop-types';
import React from 'react';
import Mask from './Mask';
import Content from './Content';

const handleMaskClick = onBlur => {
  if (typeof onBlur === 'function') {
    onBlur();
  }
};

const ModalDialog = ({ content, onBlur, fullWidthThreshold = 600 }: {
  content: React.ReactElement;
  onBlur?: () => void;
  fullWidthThreshold?: number;
}) => (
  <div>
    <Mask onClick={handleMaskClick.bind(null, onBlur)}/>
    <Content $fullWidthThreshold={fullWidthThreshold}>{content}</Content>
  </div>
);

ModalDialog.propTypes = {
  content: PropTypes.element.isRequired,
  onBlur: PropTypes.func,
  fullWidthThreshold: PropTypes.number
};

export default ModalDialog;
