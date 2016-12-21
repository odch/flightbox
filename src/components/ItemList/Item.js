import React from 'react';
import MaterialIcon from '../MaterialIcon';

const Item = props => (
  <div className="Item">
    <span className="name">{props.name}</span>
    <button
      onClick={props.onRemoveClick}
      className="remove"
    >
      <MaterialIcon icon="block"/>
    </button>
  </div>
);

Item.propTypes = {
  name: React.PropTypes.string.isRequired,
  onRemoveClick: React.PropTypes.func,
};

export default Item;
