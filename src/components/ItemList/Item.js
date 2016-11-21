import React from 'react';

const Item = props => (
  <div className="Item">
    <span className="name">{props.name}</span>
    <button
      onClick={props.onRemoveClick}
      className="remove"
    >
      <i className="material-icons">block</i>
    </button>
  </div>
);

Item.propTypes = {
  name: React.PropTypes.string.isRequired,
  onRemoveClick: React.PropTypes.func,
};

export default Item;
