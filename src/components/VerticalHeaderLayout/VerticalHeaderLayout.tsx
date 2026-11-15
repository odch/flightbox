import React from 'react';
import styled from 'styled-components';
import Header from './Header';
import Content from './Content';
import MarketingLink from '../MarketingLink';
import LanguageSwitch from '../LanguageSwitch';
import fullHeight from '../../style/fullHeight';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  ${fullHeight()}
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

interface VerticalHeaderLayoutProps {
  children: React.ReactNode;
  // Where the logo leads: the start page, unless it would show the login
  homePath?: string;
}

function VerticalHeaderLayout({ children, homePath }: VerticalHeaderLayoutProps) {
  return (
    <Wrapper>
      <Header homePath={homePath}/>
      <Main>
        <MobileLanguageSwitch/>
        <Content>{children}</Content>
      </Main>
      <MarketingLink/>
    </Wrapper>
  );
}

export default VerticalHeaderLayout;
