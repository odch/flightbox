import React, { Component } from 'react';
import './ArrivalPage.scss';
import AircraftData from '../AircraftData';
import PilotData from '../PilotData';
import PassengerData from '../Arrival/PassengerData';
import DepartureArrivalData from '../Arrival/DepartureArrivalData';
import FlightData from '../Arrival/FlightData';
import Finish from '../Arrival/Finish';
import MovementWizardPage from '../MovementWizardPage';
import dates from '../../core/dates.js';

class ArrivalPage extends Component {

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
        label="Ankunft"
        className="ArrivalPage"
        firebaseUri="https://mfgt-flights.firebaseio.com/arrivals/"
        movementKey={this.props.params.key}
        pages={this.pages}
        finishComponentClass={Finish}
        defaultTime={dates.localTimeRounded(15, 'down')}
      />
    );
  }
}

export default ArrivalPage;
