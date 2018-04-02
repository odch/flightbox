import styled from 'styled-components';

const Wrapper = styled.div`
  padding: 1px;
  border-bottom: 1px solid #000;
  
  ${props => !props.readOnly && `cursor: pointer;`};
`;

export default Wrapper;
