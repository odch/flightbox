import styled from 'styled-components';

const Option = styled.div<{ $focussed?: boolean }>`
  cursor: pointer;

  ${props => props.$focussed && `
    background-color: #fafafa;

    * {
      color: ${props.theme.colors.main};
    }
  `}
`;

export default Option;
