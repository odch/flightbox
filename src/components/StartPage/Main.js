import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import MarketingLink from '../MarketingLink';
import Hints from './Hints';
import EntryPoints from './EntryPoints';

const Wrapper = styled.div`
  position: absolute;
  top: 25%;
  width: 100%;
`;

class Main extends React.PureComponent {

  render() {
    return (
      <Wrapper>
        <Hints guest={this.props.auth.data.guest}/>
        <EntryPoints admin={this.props.auth.data.admin} guest={this.props.auth.data.guest}/>
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
      links: PropTypes.bool
    })
  }).isRequired,
};

export default Main;
