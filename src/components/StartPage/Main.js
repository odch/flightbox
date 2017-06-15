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
        <Hints/>
        <EntryPoints admin={this.props.admin}/>
        <MarketingLink/>
      </Wrapper>
    );
  }
}

Main.propTypes = {
  admin: React.PropTypes.bool,
};

export default Main;
