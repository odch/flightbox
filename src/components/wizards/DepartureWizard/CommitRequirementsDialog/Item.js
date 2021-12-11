import styled from 'styled-components';

const Item = styled.li`
  margin-bottom: 0.5em;
  padding-left: 1.5em;

  &:before {
    font-family: 'Material Icons';
    content: '\\e876';
    margin-left: -1.5em;
    margin-right: 0.5em;
    vertical-align: middle;
  }

  ${props => Object.keys(props.styles || {}).map(styleKey => `${styleKey}: ${props.styles[styleKey]};`)}
`;

export default Item;
