import styled from 'styled-components';

const colors = props => {
  if (props.$primary) {
    return `
      background-color: ${props.disabled ? `#ccc` : props.theme.colors.main};
      color: #fff;
    `;
  }

  if (props.$danger) {
    return props.flat ? `
      background-color: #fff;
      color: ${props.theme.colors.danger};
    ` : `
      background-color: ${props.disabled ? `#ccc` : props.theme.colors.danger};
      color: #fff;
    `;
  }

  return `
    background-color: #fff;
    color: ${props.disabled
      ? `#ccc`
      : props.$neutral
        ? `#000`
        : props.theme.colors.main};
  `;
};

const StyledButton = styled.button`
  padding: 0;
  border: none;
  font-size: 1.2em;
  ${props => colors(props)}
  text-transform: uppercase;
  border-radius: 2px;
  ${props => !props.disabled && `
    cursor: pointer;
    ${!props.$flat && `box-shadow: rgba(0, 0, 0, 0.117647) 0px 1px 6px, rgba(0, 0, 0, 0.117647) 0px 1px 4px;`}
  `}
`;

export default StyledButton;
