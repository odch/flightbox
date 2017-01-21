import styled from 'styled-components';

const StyledButton = styled.button`
  padding: 0;
  border: none;
  font-size: 1.2em;
  background-color: ${props => props.disabled ? `#ccc` : props.theme.colors.main};
  color: #fff;
  text-transform: uppercase;
  border-radius: 2px;
  ${props => !props.disabled && `
    cursor: pointer;
    box-shadow: rgba(0, 0, 0, 0.117647) 0px 1px 6px, rgba(0, 0, 0, 0.117647) 0px 1px 4px;
  `}
`;

export default StyledButton;
