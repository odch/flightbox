import React, { Component } from 'react';
import BorderLayout from '../BorderLayout';
import BorderLayoutItem from '../BorderLayoutItem';
import WizardBreadcrumbs from '../WizardBreadcrumbs';
import AircraftPage from './pages/AircraftPage';
import PilotPage from './pages/PilotPage';
import PassengerPage from './pages/PassengerPage';
import DepartureArrivalPage from './pages/DepartureArrivalPage';
import FlightPage from './pages/FlightPage';
import CommitRequirementsDialog from './CommitRequirementsDialog';
import Finish from './Finish';
import './DepartureWizard.scss';

const pages = [
  {
    component: AircraftPage,
    label: 'Flugzeugdaten',
  },
  {
    component: PilotPage,
    label: 'Pilot',
  },
  {
    component: PassengerPage,
    label: 'Passagiere',
  },
  {
    component: DepartureArrivalPage,
    label: 'Start und Ziel',
  },
  {
    component: FlightPage,
    label: 'Flug',
  },
];

class DepartureWizard extends Component {

  componentDidMount() {
    this.props.initNewDeparture();
  }

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
        {this.props.wizard.committed !== true && (
          <BorderLayoutItem region="north">
            <WizardBreadcrumbs items={this.buildBreadcrumbItems()} activeItem={this.props.wizard.page}/>
          </BorderLayoutItem>
        )}
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

    const isLast = this.props.wizard.page === pages.length;

    const submitHandler = isLast ? this.props.showCommitRequirementsDialog : this.props.nextPage;

    const pageObj = pages[this.props.wizard.page - 1];
    const pageComponent = <pageObj.component previousPage={this.props.previousPage} onSubmit={submitHandler}/>;

    if (isLast && this.props.wizard.showCommitRequirementsDialog === true) {
      return (
        <div>
          {pageComponent}
          <CommitRequirementsDialog
            onCancel={this.props.hideCommitRequirementsDialog}
            onConfirm={this.props.saveDeparture}
          />
        </div>
      );
    }

    return pageComponent;
  }

  buildBreadcrumbItems() {
    return [{
      label: 'Neuer Abflug',
    }].concat(pages.map(page => ({
      label: page.label,
    })));
  }
}

DepartureWizard.propTypes = {
  wizard: React.PropTypes.object.isRequired,
  initNewDeparture: React.PropTypes.func.isRequired,
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
