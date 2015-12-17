import React, { PropTypes, Component } from 'react';
import './DeparturePage.scss';
import VerticalHeaderPage from '../VerticalHeaderPage';
import AircraftData from '../AircraftData';
import PilotData from '../PilotData';
import PassengerData from '../Departure/PassengerData';
import DepartureArrivalData from '../Departure/DepartureArrivalData';
import FlightData from '../Departure/FlightData';
import Finish from '../Departure/Finish';
import WizardContainer from '../WizardContainer';
import Firebase from 'firebase';

class DeparturePage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      data: {}
    };
    this.pages = [
      {
        id: 'aircraft',
        component: AircraftData,
        label: 'Flugzeugdaten'
      },
      {
        id: 'pilot',
        component: PilotData,
        label: 'Pilot'
      },
      {
        id: 'passenger',
        component: PassengerData,
        label: 'Passagiere'
      },
      {
        id: 'departureArrival',
        component: DepartureArrivalData,
        label: 'Start und Ziel'
      },
      {
        id: 'flight',
        component: FlightData,
        label: 'Flug'
      }
    ];
    this.firebaseCollectionRef = new Firebase('https://mfgt-flights.firebaseio.com/departures/');
    if (this.props.params.key) {
      this.update = true;
      this.firebaseCollectionRef.child(this.props.params.key).on('value', function(dataSnapshot) {
        const movement = dataSnapshot.val();
        if (this.mounted === true) {
          this.setState({
            data: movement,
          });
        } else {
          this.state.data = movement;
        }
      }.bind(this));
    } else {
      this.update = false;
    }
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount () {
    this.mounted = false;
  }

  commit(data) {
    this.setState({
      data: data
    }, function() {
      if (this.update === true) {
        this.firebaseCollectionRef.child(this.props.params.key).set(data);
      } else {
        this.firebaseCollectionRef.push(this.state.data);
      }
    }, this);
  }

  finish() {
    window.location.hash = '/';
  }

  cancel() {
    window.location.hash = '/';
  }

  render() {
    const finishComponent = <Finish finish={this.finish.bind(this)}/>;
    const rightComponent = <WizardContainer data={this.state.data}
                                            pages={this.pages}
                                            finishComponent={finishComponent}
                                            breadcrumbStart="Abflug"
                                            cancel={this.cancel.bind(this)}
                                            commit={this.commit.bind(this)}/>;
    return (
      <VerticalHeaderPage className="DeparturePage" component={rightComponent}/>
    );
  }
}

export default DeparturePage;
