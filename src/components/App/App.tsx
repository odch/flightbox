import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {Navigate, Route, Routes, useLocation, useNavigationType} from 'react-router-dom';
import LoginPage from '../../containers/LoginPageContainer';
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

const App = (props: any) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
    }
    // Keyed on location.key so same-URL pushes and query-only changes
    // also trigger scroll (matching the previous cWRP behavior), and
    // unrelated re-renders (auth refresh, showLogin toggle) do not.
  }, [location.key]);

  if (props.auth.initialized !== true) {
    return <Centered><MaterialIcon icon="sync" rotate="left"/> {t('common.loading')}</Centered>;
  }

  if ((props.auth.authenticated !== true || props.showLogin === true)
    && !UNPROTECTED_ROUTES.includes(location.pathname)) {
    return <LoginPage/>;
  }

  return (
    <Routes>
      <Route path='/' element={<StartPage/>}/>
      <Route path="/departure/new" element={<DeparturePage/>}/>
      <Route path="/departure/new/:arrivalKey" element={<DeparturePage/>}/>
      <Route path="/departure/:key" element={<DeparturePage/>}/>
      <Route path="/arrival/new" element={<ArrivalPage/>}/>
      <Route path="/arrival/new/:departureKey" element={<ArrivalPage/>}/>
      <Route path="/arrival/:key" element={<ArrivalPage/>}/>
      <Route path="/arrival/:key/payment" element={<ArrivalPaymentPage/>}/>
      <Route path="/movements" element={<MovementsPage/>}/>
      <Route path="/admin" element={<AdminPage/>}/>
      <Route path="/message" element={<MessagePage/>}/>
      <Route path="/help" element={<HelpPage/>}/>
      <Route path="/aerodrome-status" element={<AerodromeStatusPage/>}/>
      {(typeof __CONF__ === 'undefined' || __CONF__.profileEnabled !== false) && <Route path="/profile" element={<ProfilePage/>}/>}
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  );
};

(App as any).propTypes = {
  auth: PropTypes.object.isRequired,
  showLogin: PropTypes.bool.isRequired
};

export default App;
