import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import styled from 'styled-components';
import VerticalHeaderLayout from '../VerticalHeaderLayout';
import JumpNavigation from '../JumpNavigation';
import AdminNavigation from './AdminNavigation';
import AdminExportPage from './subpages/AdminExportPage';
import AdminLockMovementsPage from './subpages/AdminLockMovementsPage';
import AdminAerodromeStatusPage from './subpages/AdminAerodromeStatusPage';
import AdminMessagesPage from './subpages/AdminMessagesPage';
import AdminImportPage from './subpages/AdminImportPage';
import AdminAircraftPage from './subpages/AdminAircraftPage';
import AdminInvoiceRecipientsPage from './subpages/AdminInvoiceRecipientsPage';
import AdminGuestAccessPage from './subpages/AdminGuestAccessPage';
import AdminKioskAccessPage from './subpages/AdminKioskAccessPage';
import AdminPrivacySettingsPage from './subpages/AdminPrivacySettingsPage';
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

const renderSubPage = (activeTab: string) => {
  switch (activeTab) {
    case 'export':
      return <AdminExportPage/>;
    case 'lock-movements':
      return <AdminLockMovementsPage/>;
    case 'aerodrome-status':
      return <AdminAerodromeStatusPage/>;
    case 'messages':
      return <AdminMessagesPage/>;
    case 'import':
      return <AdminImportPage/>;
    case 'aircraft':
      return <AdminAircraftPage/>;
    case 'invoice-recipients':
      return <AdminInvoiceRecipientsPage/>;
    case 'guest-access':
      return <AdminGuestAccessPage/>;
    case 'kiosk-access':
      return <AdminKioskAccessPage/>;
    case 'privacy':
      return <AdminPrivacySettingsPage/>;
    default:
      return <AdminExportPage/>;
  }
};

const AdminPage = ({auth, guestAccessToken, kioskAccessToken}: any) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('export');
  const isAdmin = auth.data.admin === true;

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hiddenTabs: string[] = [];

  const invoicePaymentEnabled = objectToArray(__CONF__.paymentMethods).includes('invoice');
  const guestAccessEnabled = guestAccessToken && guestAccessToken.token;
  const kioskAccessEnabled = kioskAccessToken && kioskAccessToken.token;
  const memberManagementEnabled = __CONF__.memberManagement === true;

  if (!invoicePaymentEnabled) {
    hiddenTabs.push('invoice-recipients');
  }
  if (!guestAccessEnabled) {
    hiddenTabs.push('guest-access');
  }
  if (!kioskAccessEnabled) {
    hiddenTabs.push('kiosk-access');
  }
  if (!memberManagementEnabled) {
    hiddenTabs.push('import');
  }
  if (__CONF__.privacySettings !== true) {
    hiddenTabs.push('privacy');
  }

  return (
    <VerticalHeaderLayout>
      {isAdmin &&
        <Content>
          <JumpNavigation/>
          <AdminLayout>
            <AdminNavigation
              activeTab={activeTab}
              hiddenTabs={hiddenTabs}
              onTabChange={setActiveTab}
            />
            <AdminContent>
              {renderSubPage(activeTab)}
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
  })
};

export default AdminPage;
