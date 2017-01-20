import styled from 'styled-components';

const StyledButton = styled.button`
  padding: 0;
  border: none;
  font-size: 1.2em;
  background-color: transparent;
  
  &:enabled {
    cursor: pointer;
    
    &:hover {
      color: ${props => props.theme.colors.main};
    }
  }
`;

export default StyledButton;
