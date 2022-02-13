import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

import logo from './odch_logo.png';

const Wrapper = styled.div`
  padding: 1em;
  text-align: right;
`;

const A = styled.a`
  color: #666;
  text-decoration: none;
`;

const Logo = styled.img`
  margin-right: 5px;
  vertical-align: middle;
  height: 25px;
`

class MarketingLink extends React.PureComponent {

  render() {
    const props = this.props;
    const text = <>
      <Logo src={logo}/>
      <span>Flightbox</span>
    </>
    const content = props.linked
     ? <A href="https://opendigital.ch/flightbox/" target="_blank">{text}</A>
        : text
    return (
      <Wrapper className={props.className}>
        {content}
      </Wrapper>
    );
  }
}

MarketingLink.propTypes = {
  className: PropTypes.string,
  linked: PropTypes.bool
};

export default MarketingLink;
