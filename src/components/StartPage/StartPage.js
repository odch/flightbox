import React from 'react';
import Header from './Header';
import Main from './Main';

class StartPage extends React.PureComponent {

  render() {
    const props = this.props;
    return (
      <div>
        <Header logout={props.logout} auth={props.auth} showLogin={props.showLogin}/>
        <Main admin={props.auth.data.admin === true}/>
      </div>
    );
  }
}

StartPage.propTypes = {
  auth: React.PropTypes.object.isRequired,
  logout: React.PropTypes.func.isRequired,
  showLogin: React.PropTypes.func.isRequired,
};

export default StartPage;
