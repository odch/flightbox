import React, { Component } from 'react';
import './MovementsPage.scss';
import MovementList from '../MovementList';
import TabPanel from '../TabPanel';
import BorderLayout from '../BorderLayout';
import BorderLayoutItem from '../BorderLayoutItem';
import Config from 'Config';
import Firebase from 'firebase';
import { firebaseToLocal, localToFirebase, compareDescending } from '../../util/movements.js';

class MovementsPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      lockDate: null,
    };
  }

  componentWillMount() {
    this.firebaseRef = new Firebase(Config.firebaseUrl + '/settings/lockDate');
    this.firebaseRef.on('value', this.onLockDateValue, this);
  }

  componentWillUnmount() {
    this.firebaseRef.off('value', this.onLockDateValue, this);
  }

  onLockDateValue(data) {
    this.setState({
      lockDate: data.val(),
    });
  }

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
        comparator={compareDescending}
        localToFirebase={localToFirebase}
        firebaseToLocal={firebaseToLocal}
        onClick={this.departuresListClick.bind(this)}
        onAction={this.departuresActionClick.bind(this)}
        actionLabel={<span><i className="material-icons">flight_land</i> Ankunft erfassen</span>}
        lockDate={this.state.lockDate}
      />
    );
    const arrivalsList = (
      <MovementList
        key="arrivals"
        className="arrivals"
        firebaseUri={Config.firebaseUrl + '/arrivals/'}
        comparator={compareDescending}
        localToFirebase={localToFirebase}
        firebaseToLocal={firebaseToLocal}
        onClick={this.arrivalsListClick.bind(this)}
        onAction={this.arrivalsActionClick.bind(this)}
        actionLabel={<span><i className="material-icons">flight_takeoff</i> Abflug erfassen</span>}
        lockDate={this.state.lockDate}
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
            <a href="#/">
              <img className="logo" src={logoImagePath}/>
            </a>
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
