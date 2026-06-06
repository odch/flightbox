import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import Hints from './Hints';
import EntryPoints from './EntryPoints';
import InstallCard from './InstallCard';
import AerodromeStatusBanner from '../AerodromeStatusBanner';
import PostLoginPasskeyPrompt from '../../containers/PostLoginPasskeyPromptContainer';

const Wrapper = styled.div`
  padding-top: 70px;
`;

const Promotions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1em;
  margin: 1em 1em 0;
`;

const Main = ({ auth }: any) => (
  <Wrapper>
    <AerodromeStatusBanner/>
    <Hints guest={auth.data.guest} kiosk={auth.data.kiosk} hintsDismissable={auth.data.hintsDismissable}/>
    <EntryPoints admin={auth.data.admin} guest={auth.data.guest} kiosk={auth.data.kiosk}/>
    <Promotions>
      <PostLoginPasskeyPrompt/>
      <InstallCard authData={auth.data} />
    </Promotions>
  </Wrapper>
);

Main.propTypes = {
  auth: PropTypes.shape({
    data: PropTypes.shape({
      admin: PropTypes.bool,
      guest: PropTypes.bool,
      kiosk: PropTypes.bool,
    })
  }).isRequired,
};

export default Main;
