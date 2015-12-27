import React, { PropTypes, Component } from 'react';
import './DeparturePage.scss';
import VerticalHeaderPage from '../VerticalHeaderPage';
import PassengerData from '../Departure/PassengerData';
import DepartureArrivalData from '../Departure/DepartureArrivalData';
import FlightData from '../Departure/FlightData';
import Finish from '../Departure/Finish';
import MovementWizardPage from '../MovementWizardPage';
import dates from '../../core/dates.js';

class DeparturePage extends Component {

  render() {
    return (
      <MovementWizardPage label="Abflug"
                          className="DeparturePage"
                          firebaseUri="https://mfgt-flights.firebaseio.com/departures/"
                          movementKey={this.props.params.key}
                          passengerDataComponentClass={PassengerData}
                          departureArrivalDataComponentClass={DepartureArrivalData}
                          flightDataComponentClass={FlightData}
                          finishComponentClass={Finish}
                          defaultTime={dates.localTimeRounded(15, 'up')}/>
    );
  }
}

export default DeparturePage;
