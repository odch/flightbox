import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {withRouter} from "react-router-dom";
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

class AdminPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'export'
    };
    this.handleTabChange = this.handleTabChange.bind(this)
  }

  componentWillMount() {
    if (this.props.auth.data.admin !== true) {
      this.props.history.push('/');
    }
  }

  handleTabChange(tab) {
    this.setState({activeTab: tab});
  }

  renderSubPage() {
    switch (this.state.activeTab) {
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
      default:
        return <AdminExportPage/>;
    }
  };

  render() {
    const hiddenTabs = []

    const invoicePaymentEnabled = objectToArray(__CONF__.paymentMethods).includes('invoice')
    const guestAccessEnabled = this.props.guestAccessToken && this.props.guestAccessToken.token
    const kioskAccessEnabled = this.props.kioskAccessToken && this.props.kioskAccessToken.token

    if (!invoicePaymentEnabled) {
      hiddenTabs.push('invoice-recipients')
    }
    if (!guestAccessEnabled) {
      hiddenTabs.push('guest-access')
    }
    if (!kioskAccessEnabled) {
      hiddenTabs.push('kiosk-access')
    }

    return (
      <VerticalHeaderLayout>
        {this.props.auth.data.admin === true &&
          <Content>
            <JumpNavigation/>
            <AdminLayout>
              <AdminNavigation
                activeTab={this.state.activeTab}
                hiddenTabs={hiddenTabs}
                onTabChange={this.handleTabChange}
              />
              <AdminContent>
                {this.renderSubPage()}
              </AdminContent>
            </AdminLayout>
          </Content>
        }
      </VerticalHeaderLayout>
    );
  }
}

AdminPage.propTypes = {
  auth: PropTypes.object.isRequired,
  guestAccessToken: PropTypes.shape({
    token: PropTypes.string
  }),
  kioskAccessToken: PropTypes.shape({
    token: PropTypes.string
  })
};

export default withRouter(AdminPage);
