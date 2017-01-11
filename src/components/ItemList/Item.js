import React from 'react';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';

const Wrapper = styled.div`
  width: 130px;
  font-size: 1.3em;
  margin-bottom: 0.5em;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const RemoveButton = styled.button`
  cursor: pointer;
  border: none;
  background: none;
  
  &:hover {
    color: ${props => props.theme.colors.main};
  }
`;

const Item = props => (
  <Wrapper>
    <span>{props.name}</span>
    <RemoveButton onClick={props.onRemoveClick}>
      <MaterialIcon icon="block"/>
    </RemoveButton>
  </Wrapper>
);

Item.propTypes = {
  name: React.PropTypes.string.isRequired,
  onRemoveClick: React.PropTypes.func,
};

export default Item;
