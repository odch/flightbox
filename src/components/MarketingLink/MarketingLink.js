import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  padding: 1em;
  text-align: right;
`;

const A = styled.a`
  color: ${props => props.theme.colors.main};
  text-decoration: underline;
`;

class MarketingLink extends React.PureComponent {

  render() {
    const props = this.props;
    return (
      <Wrapper className={props.className}>
        <A href="https://opendigital.ch/flightbox/" target="_blank">Flightbox</A> unterstützt von <A href="https://opendigital.ch/" target="_blank">open digital</A>
      </Wrapper>
    );
  }
}

MarketingLink.propTypes = {
  className: React.PropTypes.string
};

export default MarketingLink;
