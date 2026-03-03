import React from 'react';
import styled from 'styled-components';
import MaterialIcon from '../MaterialIcon';

const Wrapper = styled.div`
  text-align: center;
`;

const LoadingInfo = () => (
  <Wrapper><MaterialIcon icon="sync" rotate="left"/> Bewegungen werden geladen ...</Wrapper>
);

export default LoadingInfo;
