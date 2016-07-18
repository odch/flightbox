import React, { PropTypes, Component } from 'react';
import LoginPage from '../../containers/LoginPageContainer';
import './App.scss';
import 'moment/locale/de';


class App extends Component {

  render() {
    if (this.props.auth.initialized !== true) {
      return (
        <div className="App loading">
          <div>Bitte warten ...</div>
        </div>
      );
    }

    if (this.props.auth.authenticated !== true || this.props.showLogin === true) {
      return (
        <LoginPage/>
      );
    }

    return (
      <div className="App">
        {this.props.children}
      </div>
    );
  }
}

App.propTypes = {
  children: PropTypes.element.isRequired,
  auth: PropTypes.object.isRequired,
  showLogin: PropTypes.bool.isRequired,
};

export default App;
