import React from 'react';
import styled from 'styled-components';

const Tooltip = styled.div`
  position: absolute;
  bottom: 55px;
  margin-left: auto;
  margin-right: auto;
  left: 0;
  right: 0;
  background-color: #4d4d4d;
  color: #fff;
  border-radius: 5px;
  padding: 9px;
  line-height: 1.4em;
  font-size: 0.9em;
  
  &:after {
    border-top: 8px solid #4d4d4d;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    bottom: -8px;
    left: 50%;
    margin-left: -10px;
    content: "";
    width: 0;
    height: 0;
    position: absolute;
  }
`;

export default Tooltip;
