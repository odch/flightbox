import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';

const getSelectedFile = e => {
  const files = e.target.files;
  if (files.length > 0) {
    return files[0];
  }
  return null;
};

const event = value => ({
  target: {
    value,
  },
});

const handleFileChange = (onChange, e) => {
  if (typeof onChange === 'function') {
    const file = getSelectedFile(e);
    onChange(event(file));
  }
};

const RemoveButton = styled.button`
  cursor: pointer;
  border: none;
  background: none;
  vertical-align: middle;
  
  &:hover {
    color: ${props => props.theme.colors.main};
  }
`;

const FileInput = props => (
  <div>
    {props.value
    ? (
      <div>
        {!props.disabled && (
          <RemoveButton onClick={() => props.onChange(event(null))}>
            <MaterialIcon icon="block"/>
          </RemoveButton>
        )}
        <span>{props.value.name}</span>
      </div>
    )
    : (
      <input
        type="file"
        onChange={handleFileChange.bind(null, props.onChange)}
        disabled={props.disabled}
      />
    )}
  </div>
);

FileInput.propTypes = {
  value: PropTypes.shape({
    name: PropTypes.string.isRequired,
  }),
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};

export default FileInput;
