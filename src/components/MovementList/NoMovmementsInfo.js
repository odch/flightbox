import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  text-align: center;
  color: ${props => props.theme.colors.danger}
`;

const NoMovementsInfo = () => (
  <Wrapper>Keine Bewegungen gefunden.</Wrapper>
);

export default NoMovementsInfo;
