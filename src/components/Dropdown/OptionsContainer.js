import React from 'react';
import styled from 'styled-components';

const OptionsContainer = styled.div`
  box-sizing: border-box;
  position: absolute;
  top: calc(100% - 1px);
  left: 0;
  width: 100%;
  z-index: 1000;
  background-color: #fff;
  border: 1px solid #ddd;
  max-height: 200px;
  overflow: auto;
`;

export default OptionsContainer;
