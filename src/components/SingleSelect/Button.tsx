import styled from 'styled-components';

interface ButtonProps {
  $selected?: boolean;
  $widthPercentage?: number;
  $orientation?: string;
  $alignStart?: boolean;
}

const Button = styled.button<ButtonProps>`
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
    ${props => props.$alignStart
      ? `
        /* A column of its own, level with the first line of the label */
        flex: none;
        width: 1em;
        margin-right: 0.5em;
        line-height: 1em;
      `
      : `float: left;`}

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

  ${props => props.$alignStart && `
    /* The tick and the texts side by side, the texts at the start, in
       either orientation */
    display: flex;
    align-items: flex-start;
    text-align: left;
  `}
`;

export default Button;
