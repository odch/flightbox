import React, { Component } from 'react';
import './DeparturePage.scss';
import AircraftData from '../AircraftData';
import PilotData from '../PilotData';
import PassengerData from '../Departure/PassengerData';
import DepartureArrivalData from '../Departure/DepartureArrivalData';
import FlightData from '../Departure/FlightData';
import Finish from '../Departure/Finish';
import MovementWizardPage from '../MovementWizardPage';
import dates from '../../core/dates.js';

class DeparturePage extends Component {

  constructor(props) {
    super(props);
    this.pages = [
      {
        id: 'aircraft',
        component: AircraftData,
        label: 'Flugzeugdaten',
      },
      {
        id: 'pilot',
        component: PilotData,
        label: 'Pilot',
      },
      {
        id: 'passenger',
        component: PassengerData,
        label: 'Passagiere',
      },
      {
        id: 'departureArrival',
        component: DepartureArrivalData,
        label: 'Start und Ziel',
      },
      {
        id: 'flight',
        component: FlightData,
        label: 'Flug',
      },
    ];
  }

  render() {
    return (
      <MovementWizardPage
        label="Abflug"
        className="DeparturePage"
        firebaseUri="https://mfgt-flights.firebaseio.com/departures/"
        movementKey={this.props.params.key}
        pages={this.pages}
        finishComponentClass={Finish}
        defaultTime={dates.localTimeRounded(15, 'up')}
      />
    );
  }
}

export default DeparturePage;
