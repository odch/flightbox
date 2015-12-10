import React, { PropTypes, Component } from 'react';
import './DeparturePage.scss';
import AircraftData from '../AircraftData';
import PilotData from '../PilotData';
import PassengerData from '../Departure/PassengerData';
import DepartureArrivalData from '../Departure/DepartureArrivalData';
import FlightData from '../Departure/FlightData';
import Finish from '../Departure/Finish';
import WizardNavigation from '../WizardNavigation';
import WizardBreadcrumbs from '../WizardBreadcrumbs';
import LanguageNavigation from '../LanguageNavigation';
import Firebase from 'firebase';

class DeparturePage extends Component {

  static propTypes = {
    finish: PropTypes.func,
    cancel: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      step: 0,
      data: {},
      committed: false,
    };
    this.firebaseRef = new Firebase('https://mfgt-flights.firebaseio.com/departures/');
  }

  getUpdateHandlerDelegate(key, scope) {
    return function(data) {
      scope.updateData(key, data);
    };
  }

  updateData(key, value) {
    const data = this.state.data;
    data[key] = value;
    this.setState({
      data: data,
    });
  }

  nextStep() {
    this.setState({
      step: this.state.step + 1,
    });
  }

  previousStep() {
    this.setState({
      step: this.state.step - 1,
    });
  }

  commit() {
    this.setState({
      committed: true,
    }, function() {
      this.firebaseRef.push(this.state.data);
    }, this);
  }

  finish() {
    this.props.finish();
  }

  cancel() {
    this.props.cancel();
  }

  render() {
    let rightComponent;

    if (this.state.committed === true) {
      rightComponent = (
        <div className="right">
          <div className="wrapper">
            <Finish finish={this.props.finish}/>
          </div>
        </div>);
    } else {
      const pages = [
        {
          component: <AircraftData data={this.state.data.aircraft} updateData={this.getUpdateHandlerDelegate('aircraft', this)}/>,
          nextStep: this.nextStep.bind(this),
          previousStep: this.cancel.bind(this),
          breadcrumb: {
            label: 'Flugzeugdaten',
            handler: function() {
              this.setState({ step: 0 });
            }.bind(this),
          },
        }, {
          component: <PilotData data={this.state.data.pilot} updateData={this.getUpdateHandlerDelegate('pilot', this)}/>,
          nextStep: this.nextStep.bind(this),
          previousStep: this.previousStep.bind(this),
          breadcrumb: {
            label: 'Pilot',
            handler: function() {
              this.setState({ step: 1 });
            }.bind(this),
          },
        }, {
          component: <PassengerData data={this.state.data.passenger} updateData={this.getUpdateHandlerDelegate('passenger', this)}/>,
          nextStep: this.nextStep.bind(this),
          previousStep: this.previousStep.bind(this),
          breadcrumb: {
            label: 'Passagiere',
            handler: function() {
              this.setState({ step: 2 });
            }.bind(this),
          },
        }, {
          component: <DepartureArrivalData data={this.state.data.departureArrival} updateData={this.getUpdateHandlerDelegate('departureArrival', this)}/>,
          nextStep: this.nextStep.bind(this),
          previousStep: this.previousStep.bind(this),
          breadcrumb: {
            label: 'Start und Ziel',
            handler: function() {
              this.setState({ step: 3 });
            }.bind(this),
          },
        }, {
          component: <FlightData data={this.state.data.flight} updateData={this.getUpdateHandlerDelegate('flight', this)}/>,
          nextStep: this.commit.bind(this),
          nextLabel: 'Speichern',
          previousStep: this.previousStep.bind(this),
          breadcrumb: {
            label: 'Flug',
            handler: function() {
              this.setState({ step: 4 });
            }.bind(this),
          },
        },
      ];

      const page = pages[this.state.step];

      const breadcrumbItems = [{
        label: 'Abflug',
      }];
      pages.forEach(function(page) { breadcrumbItems.push(page.breadcrumb); });

      rightComponent = (
        <div className="right">
          <div className="wrapper">
            <main>
              <WizardBreadcrumbs items={breadcrumbItems} activeItem={this.state.step + 1}/>
              {page.component}
            </main>
          </div>
          <footer>
            <WizardNavigation cancel={this.cancel.bind(this)}
                              previousStep={page.previousStep}
                              nextStep={page.nextStep}
                              nextLabel={page.nextLabel}/>
          </footer>
        </div>);
    }

    return (
      <div className="DeparturePage">
        <header>
          <img className="logo" src="mfgt_logo_transp.png"/>
          <LanguageNavigation/>
        </header>
        {rightComponent}
      </div>
    );
  }
}

export default DeparturePage;
