import styled from 'styled-components';

const Wrapper = styled.div<{ $orientation?: string }>`
  ${props => props.$orientation === 'horizontal' && `display: flex;`}
`;

export default Wrapper;
