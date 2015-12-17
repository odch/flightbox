import React, { PropTypes, Component } from 'react';
import './ArrivalPage.scss';
import VerticalHeaderPage from '../VerticalHeaderPage';
import PassengerData from '../Arrival/PassengerData';
import DepartureArrivalData from '../Arrival/DepartureArrivalData';
import FlightData from '../Arrival/FlightData';
import Finish from '../Arrival/Finish';
import MovementWizardPage from '../MovementWizardPage';

class ArrivalPage extends Component {

  render() {
    return (
      <MovementWizardPage label="Ankunft"
                          className="ArrivalPage"
                          firebaseUri="https://mfgt-flights.firebaseio.com/arrivals/"
                          movementKey={this.props.params.key}
                          passengerDataComponentClass={PassengerData}
                          departureArrivalDataComponentClass={DepartureArrivalData}
                          flightDataComponentClass={FlightData}
                          finishComponentClass={Finish}/>
    );
  }
}

export default ArrivalPage;
