import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {matchPath, Navigate, Route, Routes, useLocation, useNavigationType} from 'react-router-dom';
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
import PprRequestPage from '../../containers/PprRequestPageContainer';
import PprStatusList from '../../containers/PprStatusListContainer';
import PprGuestRequestPage from '../../containers/PprGuestRequestPageContainer';
import PprStatusPage from '../../containers/PprStatusPageContainer';
import {getPprAccess, pprEnabled} from '../../modules/ppr/access';
import type {PprAccess} from '../../modules/ppr/access';

// The pages visitors see without a login. Matched like the routes below
// (any case, with or without a trailing slash): a path that has no route
// leads to the start page, i.e. the login. The PPR request itself is behind
// the login, which offers the guest session where the link carries the
// guest access token (LoginPage).
const publicPaths = () => [
  '/aerodrome-status',
  // The status links in the pilots' emails
  ...(pprEnabled() ? ['/ppr/status/:key/:token'] : []),
];

const isPublicPath = (pathname: string) =>
  publicPaths().some(path => matchPath(path, pathname) !== null);

// The entry of PPR requests, e.g. from the link on the aerodrome's website:
// after the login, the form of a login with an email address, or the form
// without login of a guest session or a login without one
const pprRequestPage = (access: PprAccess) => {
  switch (access) {
    case 'member':
      return <PprRequestPage/>;
    case 'guest':
      return <PprGuestRequestPage/>;
    default:
      return <Navigate to="/" replace/>;
  }
};

// «Meine PPR-Anfragen»: the requests of the login's email address
const pprListPage = (access: PprAccess) => {
  if (access === 'member') {
    return <PprStatusList/>;
  }
  return <Navigate to={access === 'guest' ? '/ppr/new' : '/'} replace/>;
};

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
    && !isPublicPath(location.pathname)) {
    return <LoginPage/>;
  }

  const pprAccess = getPprAccess(props.auth);

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
      {pprEnabled() && <Route path="/ppr/new" element={pprRequestPage(pprAccess)}/>}
      {pprEnabled() && <Route path="/ppr" element={pprListPage(pprAccess)}/>}
      {pprEnabled() && (
        <Route
          path="/ppr/status/:key/:token"
          element={pprAccess === 'kiosk' ? <Navigate to="/" replace/> : <PprStatusPage/>}
        />
      )}
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  );
};

(App as any).propTypes = {
  auth: PropTypes.object.isRequired,
  showLogin: PropTypes.bool.isRequired
};

export default App;
