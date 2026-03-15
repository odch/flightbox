import styled from 'styled-components';

const Status = styled.div<{ $selected?: boolean }>`
  ${props => props.$selected && `background-color: ${props.theme.colors.background};`}

  &:hover {
    background-color: ${props => props.theme.colors.background};
  }
`;

export default Status;
