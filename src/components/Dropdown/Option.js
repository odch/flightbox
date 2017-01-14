import React from 'react';
import styled from 'styled-components';

const Option = styled.div`
  cursor: pointer;
  
  ${props => props.focussed && `
    background-color: #fafafa;
    
    * {
      color: ${props.theme.colors.main};
    }
  `}
`;

export default Option;
