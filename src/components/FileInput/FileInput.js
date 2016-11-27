import React from 'react';
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
        <button
          onClick={() => props.onChange(event(null))}
          className="remove"
        >
          <i className="material-icons">block</i>
        </button>
        {props.value.name}
      </div>
    )
    : <input type="file" onChange={handleFileChange.bind(null, props.onChange)}/>}
  </div>
);

FileInput.propTypes = {
  value: React.PropTypes.shape({
    name: React.PropTypes.string.isRequired,
  }),
  onChange: React.PropTypes.func,
};

export default FileInput;
