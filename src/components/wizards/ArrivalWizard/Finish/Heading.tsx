import styled from 'styled-components';
import MaterialIcon from '../../../MaterialIcon';
import React from 'react';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4em;
  font-size: 1.5em;
  padding: 0.5em 0;
  color: #2e7d32;
  max-width: 500px;
  margin: 0 auto;
`;

const Heading = ({ children }: { children: React.ReactNode }) => (
  <Wrapper>
    <MaterialIcon icon="check_circle" />
    {children}
  </Wrapper>
);

export default Heading;
