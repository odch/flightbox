import React, { Component } from 'react';
import BorderLayout from '../BorderLayout';
import BorderLayoutItem from '../BorderLayoutItem';
import WizardBreadcrumbs from '../WizardBreadcrumbs';
import { getFromItemKey } from '../../util/reference-number';
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
    if (this.props.params.key) {
      this.props.editDeparture(this.props.params.key);
    } else {
      this.props.initNewDeparture();
    }
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
      return <Finish finish={this.props.finish} isUpdate={this.isUpdate()}/>;
    }

    const isLast = this.props.wizard.page === pages.length;

    const submitHandler = this.getSubmitHandler(isLast);

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

  getSubmitHandler(isLast) {
    if (isLast) {
      if (this.isUpdate()) {
        return this.props.saveDeparture;
      } else {
        return this.props.showCommitRequirementsDialog;
      }
    } else {
      return this.props.nextPage;
    }
  }

  buildBreadcrumbItems() {
    const label = this.isUpdate()
      ? 'Abflug bearbeiten (' + getFromItemKey(this.props.params.key) + ')'
      : 'Neuer Abflug';

    return [{
      label,
    }].concat(pages.map(page => ({
      label: page.label,
    })));
  }

  isUpdate() {
    return typeof this.props.params.key === 'string' && this.props.params.key.length > 0;
  }
}

DepartureWizard.propTypes = {
  wizard: React.PropTypes.object.isRequired,
  params: React.PropTypes.object.isRequired,
  initNewDeparture: React.PropTypes.func.isRequired,
  editDeparture: React.PropTypes.func.isRequired,
  nextPage: React.PropTypes.func.isRequired,
  previousPage: React.PropTypes.func.isRequired,
  finish: React.PropTypes.func.isRequired,
  showCommitRequirementsDialog: React.PropTypes.func.isRequired,
  hideCommitRequirementsDialog: React.PropTypes.func.isRequired,
  saveDeparture: React.PropTypes.func.isRequired,
  destroyForm: React.PropTypes.func.isRequired,
};

DepartureWizard.contextTypes = {
  router: React.PropTypes.object.isRequired,
};

export default DepartureWizard;
