import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  position: absolute;
  left: 17%;
  right: 0;
  top: 0;
  bottom: 0;
  overflow: auto;
  
  @media screen and (max-width: 768px) {
    left: 0;
  }
`;

const Content = props => (
  <Wrapper>{props.children}</Wrapper>
);

Content.propTypes = {
  children: React.PropTypes.element.isRequired
};

export default Content;
