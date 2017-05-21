import React, {PropTypes} from 'react';
import LoginPage from '../../containers/LoginPageContainer';
import Centered from '../Centered';
import MaterialIcon from '../MaterialIcon';

class App extends React.PureComponent {

  render() {
    const props = this.props;
    if (props.auth.initialized !== true) {
      return <Centered><MaterialIcon icon="sync" rotate="left"/> Bitte warten ...</Centered>;
    }

    if (props.auth.authenticated !== true || props.showLogin === true) {
      return <LoginPage/>;
    }

    return <div>{props.children}</div>;
  }
}

App.propTypes = {
  children: PropTypes.element.isRequired,
  auth: PropTypes.object.isRequired,
  showLogin: PropTypes.bool.isRequired,
};

export default App;
