import React, { Component } from 'react';
import './AdminPage.scss';
import BorderLayout from '../BorderLayout';
import BorderLayoutItem from '../BorderLayoutItem';
import AirstatReportForm from '../AirstatReportForm';
import LandingsReportForm from '../LandingsReportForm';
import LockMovementsForm from '../LockMovementsForm';
import MessageList from '../MessageList';
import LabeledBox from '../LabeledBox';
import UserImportForm from '../UserImportForm';
import AerodromeImportForm from '../AerodromeImportForm';
import AircraftImportForm from '../AircraftImportForm';
import FirebaseKeyList from '../FirebaseKeyList';
import JumpNavigation from '../JumpNavigation';

class AdminPage extends Component {

  componentWillMount() {
    if (this.props.auth.data.admin !== true) {
      this.props.history.push('/');
    }
  }

  render() {
    const logoImagePath = require('../../resources/mfgt_logo_transp.png');
    return (
      <BorderLayout className="AdminPage">
        <BorderLayoutItem region="west">
          <header>
            <a href="#/">
              <img className="logo" src={logoImagePath}/>
            </a>
          </header>
        </BorderLayoutItem>
        {this.props.auth.data.admin === true &&
          <BorderLayoutItem region="middle">
            <JumpNavigation/>
            <AirstatReportForm/>
            <LandingsReportForm/>
            <LockMovementsForm/>
            <LabeledBox label="Nachrichten" className="messages">
              <MessageList firebaseUri="/messages/"/>
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
            <LabeledBox label="Flugzeuge der MFGT" className="mfgt-aircrafts">
              <FirebaseKeyList path="/settings/aircraftsMFGT"/>
            </LabeledBox>
            <LabeledBox label="In Lommis stationierte Flugzeuge (ohne Flugzeuge der MFGT)" className="lszt-aircrafts">
              <FirebaseKeyList path="/settings/aircraftsLSZT"/>
            </LabeledBox>
          </BorderLayoutItem>}
      </BorderLayout>
    );
  }
}

AdminPage.propTypes = {
  auth: React.PropTypes.object.isRequired,
  history: React.PropTypes.object.isRequired,
};

export default AdminPage;
