import PropTypes from 'prop-types';
import React from 'react';
import Header from './Header';
import Content from './Content';

class VerticalHeaderLayout extends React.PureComponent {

  render() {
    return (
      <div>
        <Header/>
        <Content>{this.props.children}</Content>
      </div>
    );
  }
}

VerticalHeaderLayout.propTypes = {
  children: PropTypes.element.isRequired
};

export default VerticalHeaderLayout;
