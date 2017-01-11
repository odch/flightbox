import React from 'react';
import MaterialIcon from '../MaterialIcon';
import './FileInput.scss';

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

const FileInput = props => (
  <div className="FileInput">
    {props.value
    ? (
      <div>
        {!props.disabled && (
          <button
            onClick={() => props.onChange(event(null))}
            className="remove"
          >
            <MaterialIcon icon="block"/>
          </button>
        )}
        {props.value.name}
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
  value: React.PropTypes.shape({
    name: React.PropTypes.string.isRequired,
  }),
  onChange: React.PropTypes.func,
  disabled: React.PropTypes.bool,
};

export default FileInput;
