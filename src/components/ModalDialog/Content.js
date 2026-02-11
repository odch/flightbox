import styled from 'styled-components';
import Centered from '../Centered';

const Content = styled(Centered)`
  position: fixed;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 1em;
  background-color: #fff;
  box-shadow: 0 0 2em 0 #aaa;
  z-index: 10000;

  @media(max-width: ${props => props.$fullWidthThreshold}px) {
    width: 85%;
  }
`;

export default Content;
