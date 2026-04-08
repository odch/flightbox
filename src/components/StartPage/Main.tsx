import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import Hints from './Hints';
import EntryPoints from './EntryPoints';
import InstallCard from './InstallCard';

const Wrapper = styled.div`
  padding-top: 100px;
`;

const Main = ({ auth }: any) => (
  <Wrapper>
    <Hints guest={auth.data.guest} kiosk={auth.data.kiosk}/>
    <EntryPoints admin={auth.data.admin} guest={auth.data.guest} kiosk={auth.data.kiosk}/>
    <InstallCard authData={auth.data} />
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
