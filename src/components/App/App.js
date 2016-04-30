import React, { Component, PropTypes } from 'react';
import AuthenticationApp from './AuthenticationApp.js';

class App extends Component {
  render() {
    return (
      <div className="App">
        {this.props.children}
      </div>
    );
  }
}

App.propTypes = {
  children: PropTypes.element.isRequired,
};

export default AuthenticationApp(App);
