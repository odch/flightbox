import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  text-align: center;
  color: ${props => props.theme.colors.danger}
`;

const LoadingInfo = () => (
  <Wrapper>Bewegungen konnten nicht geladen werden.</Wrapper>
);

export default LoadingInfo;
