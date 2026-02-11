import styled from 'styled-components';

const Wrapper = styled.div`
  ${props => props.$orientation === 'horizontal' && `display: flex;`}
`;

export default Wrapper;
