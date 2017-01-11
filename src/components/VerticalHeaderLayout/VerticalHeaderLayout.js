import React from 'react';
import Header from './Header';
import Content from './Content';

const VerticalHeaderLayout = props => (
  <div>
    <Header/>
    <Content>{props.children}</Content>
  </div>
);

VerticalHeaderLayout.propTypes = {
  children: React.PropTypes.element.isRequired
};

export default VerticalHeaderLayout;
