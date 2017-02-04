import React, { Component } from 'react';
import Content from './Content';
import MovementList from '../MovementList';
import TabPanel from '../TabPanel';
import JumpNavigation from '../JumpNavigation';
import VerticalHeaderLayout from '../VerticalHeaderLayout';

class MovementsPage extends Component {

  componentWillMount() {
    this.props.loadLockDate();
  }

  departuresListClick(item) {
    this.props.showDepartureWizard(item.key);
  }

  arrivalsListClick(item) {
    this.props.showArrivalWizard(item.key);
  }

  departuresActionClick(item) {
    this.props.createArrivalFromDeparture(item.key);
  }

  arrivalsActionClick(item) {
    this.props.createDepartureFromArrival(item.key);
  }

  render() {
    const departuresList = (
      <MovementList
        key="departures"
        className="departures"
        loadItems={this.props.loadDepartures}
        items={this.props.movements.departures.data.array}
        loading={this.props.movements.departures.loading}
        loadingFailed={this.props.movements.departures.loadingFailed}
        onClick={this.departuresListClick.bind(this)}
        onAction={this.departuresActionClick.bind(this)}
        actionIcon="flight_land"
        actionLabel="Ankunft erfassen"
        lockDate={this.props.lockDate}
        deleteConfirmation={this.props.deleteConfirmation}
        deleteItem={this.props.deleteDeparture}
        hideDeleteConfirmationDialog={this.props.hideDeleteConfirmationDialog}
        showDeleteConfirmationDialog={this.props.showDeleteConfirmationDialog}
      />
    );
    const arrivalsList = (
      <MovementList
        key="arrivals"
        className="arrivals"
        loadItems={this.props.loadArrivals}
        items={this.props.movements.arrivals.data.array}
        loading={this.props.movements.arrivals.loading}
        loadingFailed={this.props.movements.arrivals.loadingFailed}
        onClick={this.arrivalsListClick.bind(this)}
        onAction={this.arrivalsActionClick.bind(this)}
        actionIcon="flight_takeoff"
        actionLabel="Abflug erfassen"
        lockDate={this.props.lockDate}
        deleteConfirmation={this.props.deleteConfirmation}
        deleteItem={this.props.deleteArrival}
        hideDeleteConfirmationDialog={this.props.hideDeleteConfirmationDialog}
        showDeleteConfirmationDialog={this.props.showDeleteConfirmationDialog}
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
      <VerticalHeaderLayout>
        <Content>
          <JumpNavigation/>
          <TabPanel tabs={tabs}/>
        </Content>
      </VerticalHeaderLayout>
    );
  }
}

MovementsPage.propTypes = {
  movements: React.PropTypes.object.isRequired,
  loadDepartures: React.PropTypes.func.isRequired,
  deleteDeparture: React.PropTypes.func.isRequired,
  loadArrivals: React.PropTypes.func.isRequired,
  deleteArrival: React.PropTypes.func.isRequired,
  lockDate: React.PropTypes.object.isRequired,
  loadLockDate: React.PropTypes.func.isRequired,
  deleteConfirmation: React.PropTypes.object,
  showDeleteConfirmationDialog: React.PropTypes.func.isRequired,
  hideDeleteConfirmationDialog: React.PropTypes.func.isRequired,
  createDepartureFromArrival: React.PropTypes.func.isRequired,
  createArrivalFromDeparture: React.PropTypes.func.isRequired,
  showDepartureWizard: React.PropTypes.func.isRequired,
  showArrivalWizard: React.PropTypes.func.isRequired,
};

export default MovementsPage;
