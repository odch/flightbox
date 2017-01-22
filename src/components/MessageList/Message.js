import styled from 'styled-components';

const Message = styled.div`
  padding: 1em;
  cursor: pointer;
  
  ${props => props.selected && `background-color: ${props.theme.colors.background};`}
  
  &:hover {
    background-color: ${props => props.theme.colors.background};
  }
`;

export default Message;
