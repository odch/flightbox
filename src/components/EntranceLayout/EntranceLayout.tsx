import React from 'react';
import styled from 'styled-components';
import Header from './Header';
import LanguageSwitch from '../LanguageSwitch';
import fullHeight from '../../style/fullHeight';

const Wrapper = styled.div`
  display: flex;
  ${fullHeight()}
  position: relative;

  @media screen and (max-width: 520px) {
    & {
      flex-direction: column;
    }
  }
`;

const StyledLanguageSwitch = styled(LanguageSwitch)`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
`;

const ContentWrapper = styled.div`
  width: 60%;
  display: flex;
  align-items: center;
  justify-content: center;

  @media screen and (max-width: 520px) {
    & {
      width: 100%;
      flex: 1;
    }
  }
`;

const ContentInnerWrapper = styled.div`
  width: 60%;
  max-width: 800px;
  padding: 1em;

  @media screen and (max-width: 520px) {
    & {
      width: 100%;
    }
  }
`;

// The pages visitors enter on, the login and the PPR intro: the logo and
// the aerodrome's name beside the content, above it on phones
const EntranceLayout = ({ children }: { children: React.ReactNode }) => (
  <Wrapper>
    <StyledLanguageSwitch/>
    <Header/>
    <ContentWrapper>
      <ContentInnerWrapper>{children}</ContentInnerWrapper>
    </ContentWrapper>
  </Wrapper>
);

export default EntranceLayout;
