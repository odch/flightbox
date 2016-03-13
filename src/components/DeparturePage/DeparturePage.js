import React, { Component } from 'react';
import './DeparturePage.scss';
import AircraftData from '../AircraftData';
import PilotData from '../PilotData';
import PassengerData from '../Departure/PassengerData';
import DepartureArrivalData from '../Departure/DepartureArrivalData';
import FlightData from '../Departure/FlightData';
import Finish from '../Departure/Finish';
import CommitRequirementsDialog from '../Departure/CommitRequirementsDialog';
import MovementWizardPage from '../MovementWizardPage';
import { firebaseToLocal } from '../../util/movements.js';
import dates from '../../core/dates.js';
import Config from 'Config';

class DeparturePage extends Component {

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
    if (this.props.params.arrivalKey) {
      const firebaseRef = new Firebase(Config.firebaseUrl + '/arrivals/');
      firebaseRef.child(this.props.params.arrivalKey).once('value', this.onFirebaseValue, this);
    } else {
      this.setState({
        defaultData: {
          date: dates.localDate(),
          time: dates.localTimeRounded(15, 'up'),
        },
      });
    }
  }

  onFirebaseValue(dataSnapshot) {
    const defaultData = {
      date: dates.localDate(),
      time: dates.localTimeRounded(15, 'up'),
    };

    const val = dataSnapshot.val();
    if (val) {
      const arrival = firebaseToLocal(dataSnapshot.val());

      defaultData.immatriculation = arrival.immatriculation;
      defaultData.aircraftType = arrival.aircraftType;
      defaultData.mtow = arrival.mtow;
      defaultData.memberNr = arrival.memberNr;
      defaultData.lastname = arrival.lastname;
      defaultData.firstname = arrival.firstname;
      defaultData.phone = arrival.phone;
      defaultData.passengerCount = arrival.passengerCount || 0;
      defaultData.location = arrival.location;
      defaultData.flightType = arrival.flightType;
    }

    this.setState({
      defaultData,
    });
  }

  render() {
    if (this.state.defaultData === null) {
      return (
        <div className="DeparturePage loading">Bitte warten. Daten werden geladen.</div>
      );
    }

    return (
      <MovementWizardPage
        label="Abflug"
        className="DeparturePage"
        firebaseUri={'/departures/'}
        movementKey={this.props.params.key}
        pages={this.pages}
        finishComponentClass={Finish}
        commitRequirementsDialogClass={CommitRequirementsDialog}
        defaultData={this.state.defaultData}
      />
    );
  }
}

export default DeparturePage;
