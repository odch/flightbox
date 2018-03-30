import React, { Component } from 'react';
import { withRouter } from "react-router-dom";
import LabeledBox from '../LabeledBox';
import JumpNavigation from '../JumpNavigation';
import VerticalHeaderLayout from '../VerticalHeaderLayout';
import AirstatReportForm from '../../containers/AirstatReportFormContainer';
import LandingsReportForm from '../../containers/LandingsReportFormContainer';
import LockMovementsForm from '../../containers/LockMovementsFormContainer';
import YearlySummaryReportForm from '../../containers/YearlySummaryReportFormContainer';
import MessageList from '../../containers/MessageListContainer';
import UserImportForm from '../../containers/UserImportFormContainer';
import AerodromeImportForm from '../../containers/AerodromeImportFormContainer';
import AircraftImportForm from '../../containers/AircraftImportFormContainer';
import AircraftsItemList from '../../containers/AircraftsItemListContainer';
import Content from './Content';

class AdminPage extends Component {

  componentWillMount() {
    if (this.props.auth.data.admin !== true) {
      this.props.history.push('/');
    }
  }

  render() {
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
            <LabeledBox label="Jahreszusammenfassung herunterladen (CSV)">
              <YearlySummaryReportForm/>
            </LabeledBox>
            <LockMovementsForm/>
            <LabeledBox label="Nachrichten" className="messages" contentPadding={0}>
              <MessageList/>
            </LabeledBox>
            <LabeledBox label="Benutzerliste importieren" className="user-import">
              <UserImportForm/>
            </LabeledBox>
            <LabeledBox label="Flugplatzliste importieren" className="aerodrome-import">
              <AerodromeImportForm/>
            </LabeledBox>
            <LabeledBox label="Flugzeugliste importieren" className="aircraft-import">
              <AircraftImportForm/>
            </LabeledBox>
            <LabeledBox label="Club-Flugzeuge">
              <AircraftsItemList type="club"/>
            </LabeledBox>
            <LabeledBox label="Auf diesem Flugplatz stationierte Flugzeuge (ohne Club-Flugzeuge)">
              <AircraftsItemList type="homeBase"/>
            </LabeledBox>
          </Content>}
      </VerticalHeaderLayout>
    );
  }
}

AdminPage.propTypes = {
  auth: React.PropTypes.object.isRequired,
};

export default withRouter(AdminPage);
