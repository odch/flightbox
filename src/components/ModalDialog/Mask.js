import styled from 'styled-components';

const Mask = styled.div.attrs({
  'data-testid': 'modal-mask'
})`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #fff;
  opacity: 0.7;
  z-index: 9999;
`;

export default Mask;
