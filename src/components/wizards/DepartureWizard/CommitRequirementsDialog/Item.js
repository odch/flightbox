import styled from 'styled-components';

const Item = styled.li`
  margin-bottom: 0.5em;
  
  &:before {
    font-family: 'Material Icons';
    content: '\\e876';
    margin-right: 0.5em;
    vertical-align: middle;
  }
`;

export default Item;
