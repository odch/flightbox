import React, { Component } from 'react';
import './AdminPage.scss';
import BorderLayout from '../BorderLayout';
import BorderLayoutItem from '../BorderLayoutItem';
import ReportForm from '../ReportForm';
import LockMovementsForm from '../LockMovementsForm';
import MessageList from '../MessageList';
import LabeledBox from '../LabeledBox';
import UserImportForm from '../UserImportForm';
import AerodromeImportForm from '../AerodromeImportForm';
import Config from 'Config';

class AdminPage extends Component {

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
        <BorderLayoutItem region="middle">
          <ReportForm/>
          <LockMovementsForm/>
          <LabeledBox label="Nachrichten" className="messages">
            <MessageList firebaseUri={Config.firebaseUrl + '/messages/'}/>
          </LabeledBox>
          <LabeledBox label="Benutzerliste importieren" className="user-import">
            <UserImportForm/>
          </LabeledBox>
          <LabeledBox label="Flugplatzliste importieren" className="aerodrome-import">
            <AerodromeImportForm/>
          </LabeledBox>
        </BorderLayoutItem>
      </BorderLayout>
    );
  }
}

export default AdminPage;
