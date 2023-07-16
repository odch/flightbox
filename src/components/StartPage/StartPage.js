import PropTypes from 'prop-types';
import React from 'react';
import Header from './Header';
import Main from './Main';

class StartPage extends React.PureComponent {

  render() {
    const props = this.props;
    return (
      <div>
        <Header logout={props.logout} auth={props.auth} showLogin={props.showLogin}/>
        <Main auth={props.auth}/>
      </div>
    );
  }
}

StartPage.propTypes = {
  auth: PropTypes.object.isRequired,
  logout: PropTypes.func.isRequired,
  showLogin: PropTypes.func.isRequired,
};

export default StartPage;
