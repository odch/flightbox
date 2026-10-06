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
import AdminAircraftPage from './subpages/AdminAircraftPage';
import AdminInvoiceRecipientsPage from './subpages/AdminInvoiceRecipientsPage';
import AdminCustomsSelfDeclarationPage from './subpages/AdminCustomsSelfDeclarationPage';
import AdminGuestAccessPage from './subpages/AdminGuestAccessPage';
import AdminKioskAccessPage from './subpages/AdminKioskAccessPage';
import AdminPrivacySettingsPage from './subpages/AdminPrivacySettingsPage';
import AdminApiAccessPage from './subpages/AdminApiAccessPage';
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
    case 'aircraft':
      return <AdminAircraftPage/>;
    case 'invoice-recipients':
      return <AdminInvoiceRecipientsPage/>;
    case 'customs-self-declaration':
      return <AdminCustomsSelfDeclarationPage/>;
    case 'guest-access':
      return <AdminGuestAccessPage/>;
    case 'kiosk-access':
      return <AdminKioskAccessPage/>;
    case 'privacy':
      return <AdminPrivacySettingsPage/>;
    case 'api-access':
      return <AdminApiAccessPage/>;
    default:
      return <AdminExportPage/>;
  }
};

const AdminPage = ({auth, guestAccessToken, kioskAccessToken, customsAvailable, checkCustomsAvailability}: any) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('export');
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
  if (__CONF__.privacySettings !== true) {
    hiddenTabs.push('privacy');
  }
  // API keys are only of use with a feature they give access to. OR further
  // API features in here.
  const apiAccessEnabled = __CONF__.reportApiEnabled === true;
  if (!apiAccessEnabled) {
    hiddenTabs.push('api-access');
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
  }),
  customsAvailable: PropTypes.bool,
  checkCustomsAvailability: PropTypes.func.isRequired,
};

export default AdminPage;
