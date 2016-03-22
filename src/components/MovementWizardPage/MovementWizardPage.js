import React, { PropTypes, Component } from 'react';
import './MovementWizardPage.scss';
import BorderLayout from '../BorderLayout';
import BorderLayoutItem from '../BorderLayoutItem';
import WizardBreadcrumbs from '../WizardBreadcrumbs';
import WizardNavigation from '../WizardNavigation';
import AircraftList from '../AircraftList';
import UserList from '../UserList';
import AerodromeList from '../AerodromeList';
import CommitFailure from '../CommitFailure';
import Firebase from 'firebase';
import { firebaseToLocal, localToFirebase, isLocked } from '../../util/movements.js';
import update from 'react-addons-update';
import Config from 'Config';

class MovementWizardPage extends Component {

  constructor(props) {
    super(props);

    this.quickSelectionConf = {
      aircraftList: {
        step: 0,
        fields: new Set(['immatriculation', 'aircraftType']),
      },
      userList: {
        step: 1,
        fields: new Set(['memberNr']),
      },
      aerodromeList: {
        step: 3,
        fields: new Set(['location']),
      },
    };

    this.state = {
      step: 0,
      committed: false,
      data: this.props.defaultData,
      showValidationErrors: false,
      validPages: {},
    };

    this.movementKey = this.props.movementKey;
    if (this.movementKey) {
      this.update = true;
    }

    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  componentWillMount() {
    this.firebaseLockDateRef = new Firebase(Config.firebaseUrl + '/settings/lockDate');
    this.firebaseLockDateRef.on('value', this.onLockDateValue, this);
    this.firebaseCollectionRef = new Firebase(Config.firebaseUrl + this.props.firebaseUri);
    if (this.update === true) {
      this.firebaseCollectionRef.child(this.props.movementKey).on('value', this.onFirebaseValue, this);
    }
    document.addEventListener('keydown', this.handleKeyDown);
    this.mounted = true;
  }

  componentWillUnmount() {
    this.firebaseLockDateRef.off('value', this.onLockDateValue, this);
    if (this.update === true) {
      this.firebaseCollectionRef.child(this.props.movementKey).off('value', this.onFirebaseValue, this);
    }
    document.removeEventListener('keydown', this.handleKeyDown);
    this.mounted = false;
  }

  onLockDateValue(dataSnapshot) {
    this.setState({
      lockDate: dataSnapshot.val(),
    });
  }

  onFirebaseValue(dataSnapshot) {
    const movement = firebaseToLocal(dataSnapshot.val());
    this.setState({
      data: movement,
    });
  }

  commit() {
    if (this.update !== true
      && this.state.commitRequirementsConfirmed !== true
      && typeof this.props.commitRequirementsDialogClass === 'function') {
      this.setState({
        showCommitRequirements: true,
      });
    } else {
      this.save();
    }
  }

  save() {
    const movement = localToFirebase(this.state.data);
    const setCommitted = (error) => {
      if (error) {
        this.setState({
          commitError: error,
        });
      } else {
        this.setState({
          committed: true,
        });
      }
    };
    if (this.update === true) {
      this.firebaseCollectionRef.child(this.props.movementKey).set(movement, setCommitted);
    } else {
      this.movementKey = this.firebaseCollectionRef.push(movement, setCommitted).key();
    }
  }

  finish() {
    window.location.hash = '/';
  }

  cancel() {
    window.location.hash = '/';
  }

  handleKeyDown(e) {
    if (e.keyCode === 13 && e.target.tagName !== 'TEXTAREA') { // enter
      this.nextStep();
    }
  }

  updateData(e) {
    const data = update(this.state.data, {
      [e.key]: { $set: e.value },
    });
    this.setState({
      data,
    });
  }

  quickSelectionListVisible(listKey) {
    const conf = this.quickSelectionConf[listKey];
    return conf && conf.step === this.state.step;
  }

  keyUpHandler(e) {
    if (this.isQuickSelectionFilterField(e.key)) {
      const filterStateKey = e.key + 'Filter';

      const stateObj = {};
      stateObj[filterStateKey] = e.value;

      this.setState(stateObj);
    }
  }

  isQuickSelectionFilterField(fieldName) {
    for (const listKey in this.quickSelectionConf) {
      if (this.quickSelectionConf.hasOwnProperty(listKey)) {
        if (this.quickSelectionConf[listKey].fields.has(fieldName)) {
          return true;
        }
      }
    }
    return false;
  }

  aircraftClickHandler(item) {
    const data = update(this.state.data, {
      immatriculation: { $set: item.key },
      aircraftType: { $set: item.value.type },
      mtow: { $set: item.value.mtow },
    });
    this.setState({
      data,
    });
  }

  userClickHandler(item) {
    const data = update(this.state.data, {
      memberNr: { $set: item.value.memberNr },
      lastname: { $set: item.value.lastname },
      firstname: { $set: item.value.firstname },
      phone: { $set: item.value.phone },
    });
    this.setState({
      data,
    });
  }

  aerodromeClickHandler(item) {
    const data = update(this.state.data, {
      location: { $set: item.key },
    });
    this.setState({
      data,
    });
  }

  nextStep() {
    if (this.isLast()) {
      if (this.validateCurrentPage() === true) {
        this.commit();
      }
    } else {
      this.goToStep(this.state.step + 1);
    }
  }

  previousStep() {
    if (this.isFirst()) {
      this.cancel();
    } else {
      this.setState({
        step: this.state.step - 1,
      });
    }
  }

  goToStep(step) {
    if (step !== this.state.step) {
      if (step < this.state.step || this.validateCurrentPage() === true) {
        this.setState({
          step,
          showValidationErrors: false,
        });
      }
    }
  }

  unsetCommitError() {
    this.setState({
      commitError: null,
    });
  }

  isFirst() {
    return this.state.step === 0;
  }

  isLast() {
    return this.state.step === (this.props.pages.length - 1);
  }

  validateCurrentPage() {
    const valid = this.refs.page.validate();
    const newState = {
      validPages: update(this.state.validPages, {
        [this.state.step]: {
          $set: valid,
        },
      }),
    };
    if (valid !== true) {
      newState.showValidationErrors = true;
    }
    this.setState(newState);
    return valid;
  }

  buildBreadcrumbItems() {
    const breadcrumbItems = [{
      label: this.props.label,
    }];
    this.props.pages.forEach((page, index) => {
      breadcrumbItems.push({
        label: page.label,
        valid: this.state.validPages[index] === true,
        handler: () => {
          this.goToStep(index);
        },
      });
    });
    return breadcrumbItems;
  }

  confirmRequirementsCancelHandler() {
    this.setState({
      showCommitRequirements: false,
    });
  }

  confirmRequirementsConfirmHandler() {
    this.setState({
      showCommitRequirements: false,
      commitRequirementsConfirmed: true,
    });
    this.save();
  }

  render() {
    const locked = isLocked(this.state.data, this.state.lockDate);
    const className = 'MovementWizardPage ' + this.props.className;
    const logoImagePath = require('../../resources/mfgt_logo_transp.png');

    let middleItem;
    let northItem;
    let southItem;
    let eastItem;
    let commitRequirements;

    if (this.state.committed === true) {
      middleItem = (
        <this.props.finishComponentClass
          itemKey={this.movementKey}
          finish={this.finish.bind(this)}
          update={this.update}
        />);
    } else if (this.state.commitError) {
      middleItem = (
        <CommitFailure
          errorMsg={this.state.commitError.message}
          back={this.unsetCommitError.bind(this)}
        />
      );
    } else {
      const breadcrumbItems = this.buildBreadcrumbItems();
      const nextLabel = this.isLast() ? 'Speichern' : 'Weiter';

      const page = this.props.pages[this.state.step];
      middleItem = (
        <page.component
          data={this.state.data}
          oppositeData={this.props.oppositeData}
          updateData={this.updateData.bind(this)}
          onKeyUp={this.keyUpHandler.bind(this)}
          ref="page"
          showValidationErrors={this.state.showValidationErrors === true}
          itemKey={this.movementKey}
          update={this.update}
          readOnly={locked}
        />
      );

      northItem = (
        <BorderLayoutItem region="north">
          <WizardBreadcrumbs items={breadcrumbItems} activeItem={this.state.step + 1}/>
        </BorderLayoutItem>
      );
      southItem = (
        <BorderLayoutItem region="south">
          <WizardNavigation
            cancel={this.cancel.bind(this)}
            previousStep={this.previousStep.bind(this)}
            nextStep={this.nextStep.bind(this)}
            nextLabel={nextLabel}
            nextVisible={!(this.isLast() && locked)}
          />
        </BorderLayoutItem>
      );

      if (this.quickSelectionListVisible('aircraftList')) {
        eastItem = (
          <BorderLayoutItem region="east">
            <AircraftList
              immatriculation={this.state.immatriculationFilter}
              aircraftType={this.state.aircraftTypeFilter}
              onClick={this.aircraftClickHandler.bind(this)}
            />
          </BorderLayoutItem>
        );
      } else if (this.quickSelectionListVisible('userList')) {
        eastItem = (
          <BorderLayoutItem region="east">
            <UserList
              memberNr={this.state.memberNrFilter}
              onClick={this.userClickHandler.bind(this)}
            />
          </BorderLayoutItem>
        );
      } else if (this.quickSelectionListVisible('aerodromeList')) {
        eastItem = (
          <BorderLayoutItem region="east">
            <AerodromeList
              aerodrome={this.state.locationFilter}
              onClick={this.aerodromeClickHandler.bind(this)}
            />
          </BorderLayoutItem>
        );
      }

      if (this.state.showCommitRequirements === true) {
        commitRequirements = (
          <this.props.commitRequirementsDialogClass
            onCancel={this.confirmRequirementsCancelHandler.bind(this)}
            onConfirm={this.confirmRequirementsConfirmHandler.bind(this)}
          />
        );
      }
    }

    return (
      <BorderLayout className={className}>
        <BorderLayoutItem region="west">
          <header>
            <a href="#/">
              <img className="logo" src={logoImagePath}/>
            </a>
          </header>
        </BorderLayoutItem>
        {northItem}
        <BorderLayoutItem region="middle">
          {middleItem}
          {commitRequirements}
        </BorderLayoutItem>
        {southItem}
        {eastItem}
      </BorderLayout>
    );
  }
}

MovementWizardPage.propTypes = {
  label: PropTypes.string,
  className: PropTypes.string,
  firebaseUri: PropTypes.string,
  movementKey: PropTypes.string,
  pages: PropTypes.array,
  finishComponentClass: PropTypes.func,
  commitRequirementsDialogClass: PropTypes.func,
  defaultData: PropTypes.object,
  oppositeData: PropTypes.object,
};

MovementWizardPage.defaultProps = {
  defaultData: {},
};

export default MovementWizardPage;
