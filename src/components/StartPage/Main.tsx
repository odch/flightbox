import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import Hints from './Hints';
import EntryPoints from './EntryPoints';
import InstallCard from './InstallCard';

const Wrapper = styled.div`
  padding-top: 100px;
`;

class Main extends React.PureComponent<any, any> {

  render() {
    return (
      <Wrapper>
        <Hints guest={this.props.auth.data.guest} kiosk={this.props.auth.data.kiosk}/>
        <EntryPoints admin={this.props.auth.data.admin} guest={this.props.auth.data.guest} kiosk={this.props.auth.data.kiosk}/>
        <InstallCard authData={this.props.auth.data} />
      </Wrapper>
    );
  }
}

(Main as any).propTypes = {
  auth: PropTypes.shape({
    data: PropTypes.shape({
      admin: PropTypes.bool,
      guest: PropTypes.bool,
      kiosk: PropTypes.bool,
    })
  }).isRequired,
};

export default Main;
