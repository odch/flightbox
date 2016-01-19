import React, { Component } from 'react';
import './MovementsPage.scss';
import MovementList from '../MovementList';
import TabPanel from '../TabPanel';
import BorderLayout from '../BorderLayout';
import BorderLayoutItem from '../BorderLayoutItem';
import Config from 'Config';

class MovementsPage extends Component {

  departuresListClick(item) {
    window.location.hash = '/departure/' + item.key;
  }

  arrivalsListClick(item) {
    window.location.hash = '/arrival/' + item.key;
  }

  departuresActionClick(item) {
    window.location.hash = '/arrival/new/' + item.key;
  }

  arrivalsActionClick(item) {
    window.location.hash = '/departure/new/' + item.key;
  }

  render() {
    const logoImagePath = require('../../resources/mfgt_logo_transp.png');
    const departuresList = (
      <MovementList
        key="departures"
        className="departures"
        firebaseUri={Config.firebaseUrl + '/departures/'}
        onClick={this.departuresListClick.bind(this)}
        onAction={this.departuresActionClick.bind(this)}
        actionLabel={<span><i className="material-icons">flight_land</i> Ankunft erfassen</span>}
      />
    );
    const arrivalsList = (
      <MovementList
        key="arrivals"
        className="arrivals"
        firebaseUri={Config.firebaseUrl + '/arrivals/'}
        onClick={this.arrivalsListClick.bind(this)}
        onAction={this.arrivalsActionClick.bind(this)}
        actionLabel={<span><i className="material-icons">flight_takeoff</i> Abflug erfassen</span>}
      />
    );
    const tabs = [{
      label: 'Abflüge',
      component: departuresList,
    }, {
      label: 'Ankünfte',
      component: arrivalsList,
    }];
    return (
      <BorderLayout className="MovementsPage">
        <BorderLayoutItem region="west">
          <header>
            <img className="logo" src={logoImagePath}/>
          </header>
        </BorderLayoutItem>
        <BorderLayoutItem region="middle">
          <TabPanel tabs={tabs}/>
        </BorderLayoutItem>
      </BorderLayout>
    );
  }
}

export default MovementsPage;
