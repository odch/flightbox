import React from 'react';
import styled from 'styled-components';
import Header from './Header';
import Content from './Content';
import MarketingLink from '../MarketingLink';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`

const Main = styled.div`
  flex: 1;
`

function VerticalHeaderLayout({ children }: { children: React.ReactNode }) {
  return (
    <Wrapper>
      <Header/>
      <Main><Content>{children}</Content></Main>
      <MarketingLink/>
    </Wrapper>
  );
}

export default VerticalHeaderLayout;
