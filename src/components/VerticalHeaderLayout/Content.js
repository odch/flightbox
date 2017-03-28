import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  margin-left: 17%;
  
  @media screen and (max-width: 768px) {
    margin-left: 0;
  }
`;

class Content extends React.PureComponent {

  render() {
    return <Wrapper>{this.props.children}</Wrapper>;
  }
}

Content.propTypes = {
  children: React.PropTypes.element.isRequired
};

export default Content;
