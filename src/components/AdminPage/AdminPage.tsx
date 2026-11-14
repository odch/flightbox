import PropTypes from 'prop-types';
import React, {useEffect} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import styled from 'styled-components';
import VerticalHeaderLayout from '../VerticalHeaderLayout';
import JumpNavigation from '../JumpNavigation';
import AdminNavigation from './AdminNavigation';
import AdminExportPage from './subpages/AdminExportPage';
import AdminLockMovementsPage from './subpages/AdminLockMovementsPage';
import AdminAerodromeStatusPage from './subpages/AdminAerodromeStatusPage';
import AdminMessagesPage from './subpages/AdminMessagesPage';
import AdminAircraftPage from './subpages/AdminAircraftPage';
import AdminInvoiceRecipientsPage from './subpages/AdminInvoiceRecipientsPage';
import AdminCustomsSelfDeclarationPage from './subpages/AdminCustomsSelfDeclarationPage';
import AdminGuestAccessPage from './subpages/AdminGuestAccessPage';
import AdminKioskAccessPage from './subpages/AdminKioskAccessPage';
import AdminPrivacySettingsPage from './subpages/AdminPrivacySettingsPage';
import AdminApiAccessPage from './subpages/AdminApiAccessPage';
import AdminPprPage from './subpages/AdminPprPage';
import Content from './Content';
import objectToArray from '../../util/objectToArray';

const AdminLayout = styled.div`
  display: flex;
  height: 100%;
  min-height: calc(100vh - 60px);

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const AdminContent = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: #fff;
  padding-left: 2rem;

  @media (max-width: 768px) {
    padding: 1rem 0 0 0;
  }
`;

// The subpage of each tab. The tab from the URL is looked up among the own
// keys only, so e.g. ?tab=constructor does not resolve.
const SUBPAGES: Record<string, React.ComponentType> = {
  'export': AdminExportPage,
  'lock-movements': AdminLockMovementsPage,
  'aerodrome-status': AdminAerodromeStatusPage,
  'messages': AdminMessagesPage,
  'aircraft': AdminAircraftPage,
  'invoice-recipients': AdminInvoiceRecipientsPage,
  'customs-self-declaration': AdminCustomsSelfDeclarationPage,
  'guest-access': AdminGuestAccessPage,
  'kiosk-access': AdminKioskAccessPage,
  'privacy': AdminPrivacySettingsPage,
  'api-access': AdminApiAccessPage,
  'ppr': AdminPprPage,
};

const DEFAULT_TAB = 'export';

const AdminPage = ({
  auth,
  guestAccessToken,
  kioskAccessToken,
  customsAvailable,
  checkCustomsAvailability,
  pprPendingCount,
  loadPprRequests,
}: any) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = auth.data.admin === true;
  const customsSelfDeclarationEnabled = __CONF__.customsSelfDeclarationEnabled === true;

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAdmin && customsSelfDeclarationEnabled) {
      checkCustomsAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // For the number of open requests on the PPR tab
  useEffect(() => {
    if (isAdmin && __CONF__.ppr === true && loadPprRequests) {
      loadPprRequests('all');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hiddenTabs: string[] = [];

  const invoicePaymentEnabled = objectToArray(__CONF__.paymentMethods).includes('invoice');
  const guestAccessEnabled = guestAccessToken && guestAccessToken.token;
  const kioskAccessEnabled = kioskAccessToken && kioskAccessToken.token;

  if (!invoicePaymentEnabled) {
    hiddenTabs.push('invoice-recipients');
  }
  // Self-declarations are enabled per project. They are a feature of the
  // customs declaration app, so the tab is also only of use when the
  // integration is configured (checked by the same API call that enables the
  // customs actions in the movement list).
  if (!customsSelfDeclarationEnabled || customsAvailable !== true) {
    hiddenTabs.push('customs-self-declaration');
  }
  if (!guestAccessEnabled) {
    hiddenTabs.push('guest-access');
  }
  if (!kioskAccessEnabled) {
    hiddenTabs.push('kiosk-access');
  }
  // The privacy tab holds the privacy settings and the PPR retention
  if (__CONF__.privacySettings !== true && __CONF__.ppr !== true) {
    hiddenTabs.push('privacy');
  }
  // API keys are only of use with a feature they give access to. OR further
  // API features in here.
  const apiAccessEnabled = __CONF__.reportApiEnabled === true;
  if (!apiAccessEnabled) {
    hiddenTabs.push('api-access');
  }
  if (__CONF__.ppr !== true) {
    hiddenTabs.push('ppr');
  }

  // The tab is kept in the URL (#/admin?tab=ppr), so the PPR notification
  // email can link to a request on the PPR tab and a reload stays on the
  // tab. Unknown tabs and tabs hidden here show the export.
  const requestedTab = searchParams.get('tab');
  const activeTab = requestedTab !== null
    && Object.prototype.hasOwnProperty.call(SUBPAGES, requestedTab)
    && !hiddenTabs.includes(requestedTab)
    ? requestedTab
    : DEFAULT_TAB;
  const SubPage = SUBPAGES[activeTab];

  // Starts the URL over with the new tab: the parameters of the previous
  // one (e.g. the request of a PPR link) don't belong to it. The tab shown
  // already replaces its entry in the history, so Back still leaves it.
  const handleTabChange = (tab: string) => {
    setSearchParams({tab}, {replace: tab === activeTab});
  };

  return (
    <VerticalHeaderLayout>
      {isAdmin &&
        <Content>
          <JumpNavigation/>
          <AdminLayout>
            <AdminNavigation
              activeTab={activeTab}
              hiddenTabs={hiddenTabs}
              onTabChange={handleTabChange}
              counts={{ppr: pprPendingCount}}
            />
            <AdminContent>
              <SubPage/>
            </AdminContent>
          </AdminLayout>
        </Content>
      }
    </VerticalHeaderLayout>
  );
};

(AdminPage as any).propTypes = {
  auth: PropTypes.object.isRequired,
  guestAccessToken: PropTypes.shape({
    token: PropTypes.string
  }),
  kioskAccessToken: PropTypes.shape({
    token: PropTypes.string
  }),
  customsAvailable: PropTypes.bool,
  checkCustomsAvailability: PropTypes.func.isRequired,
  pprPendingCount: PropTypes.number,
  loadPprRequests: PropTypes.func,
};

export default AdminPage;
