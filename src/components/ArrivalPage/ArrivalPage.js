import React, { Component } from 'react';
import './ArrivalPage.scss';
import AircraftData from '../AircraftData';
import PilotData from '../PilotData';
import PassengerData from '../Arrival/PassengerData';
import DepartureArrivalData from '../Arrival/DepartureArrivalData';
import FlightData from '../Arrival/FlightData';
import Finish from '../Arrival/Finish';
import MovementWizardPage from '../MovementWizardPage';
import LocationConfirmationDialog from '../LocationConfirmationDialog';
import dates from '../../core/dates.js';
import firebase from '../../util/firebase.js';
import { exists as aerodromeExists } from '../../util/aerodromes';

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
        confirmation: {
          predicatePromise: data => data.location ? aerodromeExists(data.location) : Promise.resolve(false),
          component: LocationConfirmationDialog,
        },
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
      firebase('/departures/', (error, ref) => {
        ref.child(this.props.params.departureKey).once('value', this.onFirebaseValue, this);
      });
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
    let departure;

    const defaultData = {
      date: dates.localDate(),
      time: dates.localTimeRounded(15, 'down'),
      landingCount: 1,
    };

    const val = dataSnapshot.val();
    if (val) {
      departure = firebaseToLocal(dataSnapshot.val());

      transferValues(departure, defaultData, [
        'immatriculation',
        'aircraftType',
        'mtow',
        'memberNr',
        'lastname',
        'firstname',
        'phone',
        { name: 'passengerCount', defaultValue: 0 },
        'location',
        'flightType',
      ]);

      if (departure.departureRoute === 'circuits') {
        defaultData.arrivalRoute = 'circuits';
      }
    }

    this.setState({
      defaultData,
      oppositeData: departure,
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
        oppositeData={this.state.oppositeData}
        route={this.props.route}
      />
    );
  }
}

export default ArrivalPage;
