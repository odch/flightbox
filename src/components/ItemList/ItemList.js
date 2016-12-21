import React from 'react';
import MaterialIcon from '../MaterialIcon';
import Item from './Item';
import './ItemList.scss';

const handleSubmit = (addItem, newItem, e) => {
  e.preventDefault();
  addItem(newItem);
};

const ItemList = props => (
  <div className="ItemList">
    <form onSubmit={handleSubmit.bind(null, props.addItem, props.newItem)}>
      <input
        type="text"
        value={props.newItem}
        onChange={e => props.changeNewItem(e.target.value)}
      />
      <button
        type="submit"
        className="add"
        disabled={props.newItem.length === 0}
      >
        <MaterialIcon icon="done"/>&nbsp;Hinzufügen
      </button>
    </form>
    <div className="items-wrap">
      {props.items.map((item, index) => {
        return (
          <Item
            key={index}
            name={item}
            onRemoveClick={props.removeItem.bind(null, item)}
          />
        );
      })}
    </div>
  </div>
);

ItemList.propTypes = {
  items: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  newItem: React.PropTypes.string.isRequired,
  changeNewItem: React.PropTypes.func.isRequired,
  addItem: React.PropTypes.func.isRequired,
  removeItem: React.PropTypes.func.isRequired,
};

export default ItemList;
