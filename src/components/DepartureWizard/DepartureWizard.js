import React, { Component } from 'react';
import BorderLayout from '../BorderLayout';
import BorderLayoutItem from '../BorderLayoutItem';
import AircraftPage from './pages/AircraftPage';
import PilotPage from './pages/PilotPage';
import PassengerPage from './pages/PassengerPage';
import DepartureArrivalPage from './pages/DepartureArrivalPage';
import FlightPage from './pages/FlightPage';
import CommitRequirementsDialog from './CommitRequirementsDialog';
import Finish from './Finish';
import './DepartureWizard.scss';

class DepartureWizard extends Component {

  render() {
    const logoImagePath = require('../../resources/mfgt_logo_transp.png');

    return (
      <BorderLayout className="DepartureWizard">
        <BorderLayoutItem region="west">
          <header>
            <a href="#/">
              <img className="logo" src={logoImagePath}/>
            </a>
          </header>
        </BorderLayoutItem>
        <BorderLayoutItem region="middle">
          {this.getMiddleItem()}
        </BorderLayoutItem>
      </BorderLayout>
    );
  }

  getMiddleItem() {
    if (this.props.wizard.committed === true) {
      return <Finish finish={this.props.finish} isUpdate={false}/>;
    }

    switch (this.props.wizard.page) {
      case 1:
        return <AircraftPage onSubmit={this.props.nextPage}/>;
      case 2:
        return <PilotPage previousPage={this.props.previousPage} onSubmit={this.props.nextPage}/>;
      case 3:
        return <PassengerPage previousPage={this.props.previousPage} onSubmit={this.props.nextPage}/>;
      case 4:
        return <DepartureArrivalPage previousPage={this.props.previousPage} onSubmit={this.props.nextPage}/>;
      case 5:
        const flightPage = <FlightPage previousPage={this.props.previousPage} onSubmit={this.props.showCommitRequirementsDialog}/>;
        if (this.props.wizard.showCommitRequirementsDialog === true) {
          return (
            <div>
              {flightPage}
              <CommitRequirementsDialog
                onCancel={this.props.hideCommitRequirementsDialog}
                onConfirm={this.props.saveDeparture}
              />
            </div>
          );
        }
        return flightPage;
      default:
        return null;
    }
  }
}

DepartureWizard.propTypes = {
  wizard: React.PropTypes.object.isRequired,
  nextPage: React.PropTypes.func.isRequired,
  previousPage: React.PropTypes.func.isRequired,
  finish: React.PropTypes.func.isRequired,
  showCommitRequirementsDialog: React.PropTypes.func.isRequired,
  hideCommitRequirementsDialog: React.PropTypes.func.isRequired,
  saveDeparture: React.PropTypes.func.isRequired,
};

DepartureWizard.contextTypes = {
  router: React.PropTypes.object.isRequired,
};

export default DepartureWizard;
