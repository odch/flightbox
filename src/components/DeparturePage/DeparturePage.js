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
import LocationConfirmationDialog from '../LocationConfirmationDialog';
import dates from '../../core/dates.js';
import firebase from '../../util/firebase.js';
import { exists as aerodromeExists } from '../../util/aerodromes';

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
    if (this.props.params.arrivalKey) {
      firebase('/arrivals/', (error, ref) => {
        ref.child(this.props.params.arrivalKey).once('value', this.onFirebaseValue, this);
      });
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

      transferValues(arrival, defaultData, [
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
        route={this.props.route}
      />
    );
  }
}

export default DeparturePage;
