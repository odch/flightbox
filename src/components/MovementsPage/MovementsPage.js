import React, { Component } from 'react';
import './MovementsPage.scss';
import MovementList from '../MovementList';
import TabPanel from '../TabPanel';
import BorderLayout from '../BorderLayout';
import BorderLayoutItem from '../BorderLayoutItem';
import JumpNavigation from '../JumpNavigation';

class MovementsPage extends Component {

  componentWillMount() {
    this.props.loadLockDate();
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
        loadItems={this.props.loadDepartures}
        items={this.props.movements.departures.data.array}
        loading={this.props.movements.departures.loading}
        onClick={this.departuresListClick.bind(this)}
        onAction={this.departuresActionClick.bind(this)}
        actionIcon="flight_land"
        actionLabel="Ankunft erfassen"
        lockDate={this.props.lockDate}
      />
    );
    const arrivalsList = (
      <MovementList
        key="arrivals"
        className="arrivals"
        loadItems={this.props.loadArrivals}
        items={this.props.movements.arrivals.data.array}
        loading={this.props.movements.arrivals.loading}
        onClick={this.arrivalsListClick.bind(this)}
        onAction={this.arrivalsActionClick.bind(this)}
        actionIcon="flight_takeoff"
        actionLabel="Abflug erfassen"
        lockDate={this.props.lockDate}
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

MovementsPage.propTypes = {
  movements: React.PropTypes.object.isRequired,
  loadDepartures: React.PropTypes.func.isRequired,
  loadArrivals: React.PropTypes.func.isRequired,
  lockDate: React.PropTypes.object.isRequired,
  loadLockDate: React.PropTypes.func.isRequired,
};

export default MovementsPage;
