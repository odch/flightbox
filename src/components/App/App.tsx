import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import {Redirect, Route, Switch} from 'react-router-dom';
import LoginPage from '../../components/LoginPage';
import Centered from '../Centered';
import MaterialIcon from '../MaterialIcon';
import MessagePage from "../../containers/MessagePageContainer";
import StartPage from "../../containers/StartPageContainer";
import DeparturePage from "../../containers/DeparturePageContainer";
import HelpPage from "../../containers/HelpPageContainer";
import MovementsPage from "../../containers/MovementsPageContainer";
import AdminPage from "../../containers/AdminPageContainer";
import ArrivalPage from "../../containers/ArrivalPageContainer";
import ArrivalPaymentPage from "../../containers/ArrivalPaymentPageContainer";
import AerodromeStatusPage from '../../containers/AerodromeStatusPageContainer';
import ProfilePage from '../../containers/ProfilePageContainer';

const UNPROTECTED_ROUTES = [
  '/aerodrome-status'
]

class App extends React.PureComponent<any, any> {

  componentWillReceiveProps(nextProps) {
    if (nextProps.history.action !== 'POP') {
      window.scrollTo(0, 0);
    }
  }

  render() {
    const props = this.props;
    const { t } = this.props;
    if (props.auth.initialized !== true) {
      return <Centered><MaterialIcon icon="sync" rotate="left"/> {t('common.loading')}</Centered>;
    }

    if ((props.auth.authenticated !== true || props.showLogin === true)
      && !UNPROTECTED_ROUTES.includes(props.location.pathname)) {
      return <LoginPage/>;
    }

    return (
      <Switch>
        <Route exact path='/' component={StartPage}/>
        <Route exact path="/departure/new" component={DeparturePage}/>
        <Route exact path="/departure/new/:arrivalKey" component={DeparturePage}/>
        <Route exact path="/departure/:key" component={DeparturePage}/>
        <Route exact path="/arrival/new" component={ArrivalPage}/>
        <Route exact path="/arrival/new/:departureKey" component={ArrivalPage}/>
        <Route exact path="/arrival/:key" component={ArrivalPage}/>
        <Route exact path="/arrival/:key/payment" component={ArrivalPaymentPage}/>
        <Route exact path="/movements" component={MovementsPage}/>
        <Route exact path="/admin" component={AdminPage}/>
        <Route exact path="/message" component={MessagePage}/>
        <Route exact path="/help" component={HelpPage}/>
        <Route exact path="/aerodrome-status" component={AerodromeStatusPage}/>
        <Route exact path="/profile" component={ProfilePage}/>
        <Redirect to="/"/>
      </Switch>
    );
  }
}

(App as any).propTypes = {
  auth: PropTypes.object.isRequired,
  showLogin: PropTypes.bool.isRequired,
  history: PropTypes.shape({
    action: PropTypes.string.isRequired
  }).isRequired
};

export default withTranslation()(App);
