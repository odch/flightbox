import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import MarketingLink from '../MarketingLink';
import Hints from './Hints';
import EntryPoints from './EntryPoints';

const Wrapper = styled.div`
  padding-top: 100px;
`;

class Main extends React.PureComponent {

  render() {
    return (
      <Wrapper>
        <Hints guest={this.props.auth.data.guest} kiosk={this.props.auth.data.kiosk}/>
        <EntryPoints admin={this.props.auth.data.admin} guest={this.props.auth.data.guest} kiosk={this.props.auth.data.kiosk}/>
        <MarketingLink linked={this.props.auth.data.links}/>
      </Wrapper>
    );
  }
}

Main.propTypes = {
  auth: PropTypes.shape({
    data: PropTypes.shape({
      admin: PropTypes.bool,
      guest: PropTypes.bool,
      kiosk: PropTypes.bool,
      links: PropTypes.bool
    })
  }).isRequired,
};

export default Main;
