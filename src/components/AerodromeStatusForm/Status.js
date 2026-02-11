import styled from 'styled-components';

const Status = styled.div`
  ${props => props.$selected && `background-color: ${props.theme.colors.background};`}

  &:hover {
    background-color: ${props => props.theme.colors.background};
  }
`;

export default Status;
