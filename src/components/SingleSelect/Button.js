import styled from 'styled-components';

const Button = styled.button`
  margin: 0;
  background-color: #fff;
  border: solid #eee;
  font-size: 1em;
  padding: 0.5em 1em;
  cursor: pointer;

  ${props => props.$selected && `color: ${props.theme.colors.main};`}
  ${props => props.$selected && `background-color: ${props.theme.colors.background};`}

  ${props => props.$widthPercentage && `width: ${props.$widthPercentage}%;`}

  &:before {
    font-family: 'Material Icons';
    content: '\\e876';
    color: #eee;
    float: left;

    ${props => props.$selected && `color: ${props.theme.colors.main};`}
  }

  &:hover {
    color: ${props => props.theme.colors.main};
    background-color: ${props => props.theme.colors.background};
  }

  &:hover:before {
    color: ${props => props.theme.colors.main};
  }

  ${props => props.$orientation === 'horizontal'
    ? `
      border-width: 1px 1px 1px 0;

      &:first-child {
        border-left-width: 1px;
        border-top-left-radius: 2px;
        border-bottom-left-radius: 2px;
      }

      &:last-child {
        border-top-right-radius: 2px;
        border-bottom-right-radius: 2px;
      }`
    : `
      width: 100%;
      border-width: 0 1px 1px 1px;
      text-align: left;

      &:first-child {
        border-top-width: 1px;
        border-top-left-radius: 2px;
        border-top-right-radius: 2px;
      }

      &:last-child {
        border-bottom-left-radius: 2px;
        border-bottom-right-radius: 2px;
      }
  `}
`;

export default Button;
