import React from 'react';
import styled from 'styled-components';
import Header from './Header';
import Content from './Content';
import MarketingLink from '../MarketingLink';
import LanguageSwitch from '../LanguageSwitch';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`

const Main = styled.div`
  flex: 1;
  position: relative;
`

const MobileLanguageSwitch = styled(LanguageSwitch)`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;

  @media screen and (min-width: 769px) {
    display: none;
  }
`;

function VerticalHeaderLayout({ children }: { children: React.ReactNode }) {
  return (
    <Wrapper>
      <Header/>
      <Main>
        <MobileLanguageSwitch/>
        <Content>{children}</Content>
      </Main>
      <MarketingLink/>
    </Wrapper>
  );
}

export default VerticalHeaderLayout;
