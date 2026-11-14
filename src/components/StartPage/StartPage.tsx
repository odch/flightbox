import React from 'react';
import styled from 'styled-components';
import Header from './Header';
import Main from './Main';
import MarketingLink from '../MarketingLink';
import fullHeight from '../../style/fullHeight';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  ${fullHeight()}
`

const ContentArea = styled.div`
  flex: 1;
`

const StartPage = ({ auth, logout, showLogin }: { auth: any, logout: () => void, showLogin: () => void }) => {
  return (
    <Wrapper>
      <Header logout={logout} auth={auth} showLogin={showLogin}/>
      <ContentArea><Main auth={auth}/></ContentArea>
      <MarketingLink/>
    </Wrapper>
  );
};

export default StartPage;
