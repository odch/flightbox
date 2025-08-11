import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  color: ${props => props.theme.colors.danger};
  background-color: ${props => props.theme.colors.danger}10;
  border: 1px solid ${props => props.theme.colors.danger}20;
  border-radius: 9999px;
  font-size: 0.9em;
  padding: 0.3rem 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NoPaymentTag = () => (
  <Wrapper>Zahlung offen</Wrapper>
);

export default NoPaymentTag;
