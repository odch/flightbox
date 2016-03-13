import React, { Component } from 'react';
import './ArrivalPage.scss';
import AircraftData from '../AircraftData';
import PilotData from '../PilotData';
import PassengerData from '../Arrival/PassengerData';
import DepartureArrivalData from '../Arrival/DepartureArrivalData';
import FlightData from '../Arrival/FlightData';
import Finish from '../Arrival/Finish';
import MovementWizardPage from '../MovementWizardPage';
import { firebaseToLocal } from '../../util/movements.js';
import dates from '../../core/dates.js';
import Config from 'Config';

class ArrivalPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      defaultData: null,
    };
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

  componentWillMount() {
    if (this.props.params.departureKey) {
      const firebaseRef = new Firebase(Config.firebaseUrl + '/departures/');
      firebaseRef.child(this.props.params.departureKey).once('value', this.onFirebaseValue, this);
    } else {
      this.setState({
        defaultData: {
          date: dates.localDate(),
          time: dates.localTimeRounded(15, 'down'),
          landingCount: 1,
        },
      });
    }
  }

  onFirebaseValue(dataSnapshot) {
    const defaultData = {
      date: dates.localDate(),
      time: dates.localTimeRounded(15, 'down'),
      landingCount: 1,
    };

    const val = dataSnapshot.val();
    if (val) {
      const departure = firebaseToLocal(dataSnapshot.val());

      defaultData.immatriculation = departure.immatriculation;
      defaultData.aircraftType = departure.aircraftType;
      defaultData.mtow = departure.mtow;
      defaultData.memberNr = departure.memberNr;
      defaultData.lastname = departure.lastname;
      defaultData.firstname = departure.firstname;
      defaultData.phone = departure.phone;
      defaultData.passengerCount = departure.passengerCount || 0;
      defaultData.location = departure.location;
      defaultData.flightType = departure.flightType;

      if (departure.departureRoute === 'circuits') {
        defaultData.arrivalRoute = 'circuits';
      }
    }

    this.setState({
      defaultData,
    });
  }

  render() {
    if (this.state.defaultData === null) {
      return (
        <div className="ArrivalPage loading">Bitte warten. Daten werden geladen.</div>
      );
    }

    return (
      <MovementWizardPage
        label="Ankunft"
        className="ArrivalPage"
        firebaseUri={'/arrivals/'}
        movementKey={this.props.params.key}
        pages={this.pages}
        finishComponentClass={Finish}
        defaultData={this.state.defaultData}
      />
    );
  }
}

export default ArrivalPage;
