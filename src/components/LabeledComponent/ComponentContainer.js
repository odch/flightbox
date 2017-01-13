import React from 'react';
import styled from 'styled-components';

const ComponentContainer = styled.div`
  padding: 0.2em;
  
  & > * {
    font-size: 1.5em;
    width: 100%;
    resize: none;
  }
`;

export default ComponentContainer;
