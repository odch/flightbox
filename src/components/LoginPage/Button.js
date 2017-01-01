import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
  padding: 0;
  border: none;
  border-radius: 5px;
  font-size: 1.2em;
  background-color: white;
  
  &:enabled {
    cursor: pointer;
  }
  
  &[type=submit]:hover:enabled {
    color: ${props => props.theme.colors.main};
  }
`;

export default Button;
