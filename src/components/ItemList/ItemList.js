import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';
import Item from './Item';

const Form = styled.form`
  margin-bottom: 2em;
`;

const Input = styled.input`
  border: solid #000;
  border-width: 0 0 1px 0;
  padding: 0.2em;
  font-size: 1.5em;
  margin-right: 1em;
`;

const AddButton = styled.button`
  border: none;
  background: none;
  font-size: 1.3em;
  
  ${props => props.disabled !== true && `cursor: pointer;`}
  
  &:hover {
    ${props => props.disabled !== true && `color: ${props.theme.colors.main};`}
  }
`;

const ItemsContainer = styled.div`
  max-height: 300px;
  overflow: auto;
`;

const handleSubmit = (addItem, newItem, e) => {
  e.preventDefault();
  addItem(newItem);
};

const ItemList = props => (
  <div>
    <Form onSubmit={handleSubmit.bind(null, props.addItem, props.newItem)}>
      <Input
        type="text"
        value={props.newItem}
        onChange={e => props.changeNewItem(e.target.value)}
      />
      <AddButton
        type="submit"
        disabled={props.newItem.length === 0}
      >
        <MaterialIcon icon="done"/>&nbsp;Hinzufügen
      </AddButton>
    </Form>
    <ItemsContainer>
      {props.items.map((item, index) => {
        return (
          <Item
            key={index}
            name={item}
            onRemoveClick={props.removeItem.bind(null, item)}
          />
        );
      })}
    </ItemsContainer>
  </div>
);

ItemList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  newItem: PropTypes.string.isRequired,
  changeNewItem: PropTypes.func.isRequired,
  addItem: PropTypes.func.isRequired,
  removeItem: PropTypes.func.isRequired,
};

export default ItemList;
