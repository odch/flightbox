import React, { Component } from 'react';
import './MovementsPage.scss';
import MovementList from '../MovementList';
import TabPanel from '../TabPanel';
import BorderLayout from '../BorderLayout';
import BorderLayoutItem from '../BorderLayoutItem';
import JumpNavigation from '../JumpNavigation';
import firebase from '../../util/firebase.js';
import { firebaseToLocal, localToFirebase, compareDescending } from '../../util/movements.js';

class MovementsPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      lockDate: null,
    };
  }

  componentWillMount() {
    firebase('/settings/lockDate', (error, ref) => {
      this.firebaseRef = ref;
      this.firebaseRef.on('value', this.onLockDateValue, this);
    });
  }

  componentWillUnmount() {
    if (this.firebaseRef) {
      this.firebaseRef.off('value', this.onLockDateValue, this);
    }
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
        firebaseUri="/departures/"
        comparator={compareDescending}
        localToFirebase={localToFirebase}
        firebaseToLocal={firebaseToLocal}
        onClick={this.departuresListClick.bind(this)}
        onAction={this.departuresActionClick.bind(this)}
        actionIcon="flight_land"
        actionLabel="Ankunft erfassen"
        lockDate={this.state.lockDate}
      />
    );
    const arrivalsList = (
      <MovementList
        key="arrivals"
        className="arrivals"
        firebaseUri="/arrivals/"
        comparator={compareDescending}
        localToFirebase={localToFirebase}
        firebaseToLocal={firebaseToLocal}
        onClick={this.arrivalsListClick.bind(this)}
        onAction={this.arrivalsActionClick.bind(this)}
        actionIcon="flight_takeoff"
        actionLabel="Abflug erfassen"
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
          <JumpNavigation/>
          <TabPanel tabs={tabs}/>
        </BorderLayoutItem>
      </BorderLayout>
    );
  }
}

export default MovementsPage;
