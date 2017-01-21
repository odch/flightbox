import styled from 'styled-components';

const Overlay = styled.div`
  padding: 12px;
  
  ${props => !props.disabled && props.hovered && `
    transition: all 300ms cubic-bezier(0.445, 0.05, 0.55, 0.95) 0ms;
    background-color: rgba(255, 255, 255, 0.2)
  `}
`;

export default Overlay;
