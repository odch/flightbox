import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {withRouter} from "react-router-dom";
import LabeledBox from '../LabeledBox';
import JumpNavigation from '../JumpNavigation';
import VerticalHeaderLayout from '../VerticalHeaderLayout';
import AirstatReportForm from '../../containers/AirstatReportFormContainer';
import LandingsReportForm from '../../containers/LandingsReportFormContainer';
import InvoicesReportForm from '../../containers/InvoicesReportFormContainer';
import LockMovementsForm from '../../containers/LockMovementsFormContainer';
import AerodromeStatusForm from '../../containers/AerodromeStatusFormContainer';
import YearlySummaryReportForm from '../../containers/YearlySummaryReportFormContainer';
import MessageList from '../../containers/MessageListContainer';
import UserImportForm from '../../containers/UserImportFormContainer';
import AircraftImportForm from '../../containers/AircraftImportFormContainer';
import AircraftsItemList from '../../containers/AircraftsItemListContainer';
import InvoiceRecipientsList from '../../containers/InvoiceRecipientsListContainer'
import Content from './Content';
import DescriptionText from './DescriptionText';
import GuestAccessBox from '../../containers/GuestAccessBoxContainer'
import objectToArray from '../../util/objectToArray'

class AdminPage extends Component {

  componentWillMount() {
    if (this.props.auth.data.admin !== true) {
      this.props.history.push('/');
    }
  }

  render() {
    const invoicePaymentEnabled = objectToArray(__CONF__.paymentMethods).includes('invoice')
    return (
      <VerticalHeaderLayout>
        {this.props.auth.data.admin === true &&
          <Content>
            <JumpNavigation/>
            <LabeledBox label="BAZL-Report herunterladen (CSV)" className="AirstatReportForm">
              <AirstatReportForm/>
            </LabeledBox>
            <LabeledBox label="Landeliste herunterladen (CSV)">
              <LandingsReportForm/>
            </LabeledBox>
            {invoicePaymentEnabled && (
              <LabeledBox label="Rechnungsberichte herunterladen (PDF)">
                <InvoicesReportForm/>
              </LabeledBox>)}
            <LabeledBox label="Jahreszusammenfassung herunterladen (CSV)">
              <YearlySummaryReportForm/>
            </LabeledBox>
            <LockMovementsForm/>
            <LabeledBox label="Flugplatz-Status" contentPadding={0}>
              <AerodromeStatusForm/>
            </LabeledBox>
            <LabeledBox label="Nachrichten" className="messages" contentPadding={0}>
              <MessageList/>
            </LabeledBox>
            <LabeledBox label="Benutzerliste importieren" className="user-import">
              <UserImportForm/>
            </LabeledBox>
            <LabeledBox label="Flugzeugliste importieren" className="aircraft-import">
              <AircraftImportForm/>
            </LabeledBox>
            <LabeledBox label="Club-Flugzeuge">
              <DescriptionText>
                Geben Sie hier die Immatrikulationen der Club-Flugzeuge ein.
                Die Immatrikulationen dürfen nur Grossbuchstaben und Zahlen enthalten.
              </DescriptionText>
              <AircraftsItemList type="club"/>
            </LabeledBox>
            <LabeledBox label="Auf diesem Flugplatz stationierte Flugzeuge (ohne Club-Flugzeuge)">
              <DescriptionText>
                Geben Sie hier die Immatrikulationen aller auf diesem Flugplatz stationierten Flugzeuge ein
                (ohne die Club-Flugzeuge).
                Die Immatrikulationen dürfen nur Grossbuchstaben und Zahlen enthalten.
              </DescriptionText>
              <AircraftsItemList type="homeBase"/>
            </LabeledBox>
            {invoicePaymentEnabled && (
              <LabeledBox label="Rechnungsempfänger">
                <InvoiceRecipientsList/>
              </LabeledBox>
            )}
            <GuestAccessBox/>
          </Content>}
      </VerticalHeaderLayout>
    );
  }
}

AdminPage.propTypes = {
  auth: PropTypes.object.isRequired,
};

export default withRouter(AdminPage);
