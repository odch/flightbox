import React, { PropTypes, Component } from 'react';
import VerticalHeaderPage from '../VerticalHeaderPage';
import AircraftData from '../AircraftData';
import PilotData from '../PilotData';
import WizardContainer from '../WizardContainer';
import Firebase from 'firebase';
import { firebaseToLocal, localToFirebase } from '../../util/movements.js';
import dates from '../../core/dates.js';

class MovementWizardPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      data: {
        date: dates.localDate(),
        time: this.props.defaultTime,
      },
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
        component: this.props.passengerDataComponentClass,
        label: 'Passagiere'
      },
      {
        id: 'departureArrival',
        component: this.props.departureArrivalDataComponentClass,
        label: 'Start und Ziel'
      },
      {
        id: 'flight',
        component: this.props.flightDataComponentClass,
        label: 'Flug'
      }
    ];
    if (this.props.movementKey) {
      this.update = true;
    }
  }

  componentWillMount() {
    this.firebaseCollectionRef = new Firebase(this.props.firebaseUri);
    if (this.update === true) {
      this.firebaseCollectionRef.child(this.props.movementKey).on('value', this.onFirebaseValue, this);
    }
  }

  componentWillUnmount() {
    if (this.update === true) {
      this.firebaseCollectionRef.child(this.props.movementKey).off('value', this.onFirebaseValue, this);
    }
  }

  onFirebaseValue(dataSnapshot) {
    const movement = firebaseToLocal(dataSnapshot.val());
    this.setState({
      data: movement,
    });
  }

  commit(data) {
    this.setState({
      data,
    }, function () {
      const movement = localToFirebase(data);
      if (this.update === true) {
        this.firebaseCollectionRef.child(this.props.movementKey).set(movement);
      } else {
        this.firebaseCollectionRef.push(movement);
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
    const finishComponent = <this.props.finishComponentClass finish={this.finish.bind(this)}/>;
    const rightComponent = <WizardContainer data={this.state.data}
                                            pages={this.pages}
                                            finishComponent={finishComponent}
                                            breadcrumbStart={this.props.label}
                                            cancel={this.cancel.bind(this)}
                                            commit={this.commit.bind(this)}/>;
    return (
      <VerticalHeaderPage className={this.props.className} component={rightComponent}/>
    );
  }
}

MovementWizardPage.propTypes = {
  label: PropTypes.string,
  className: PropTypes.string,
  firebaseUri: PropTypes.string,
  movementKey: PropTypes.string,
  passengerDataComponentClass: PropTypes.func,
  departureArrivalDataComponentClass: PropTypes.func,
  flightDataComponentClass: PropTypes.func,
  finishComponentClass: PropTypes.func,
  defaultTime: PropTypes.string,
};

export default MovementWizardPage;
