import React, { PropTypes, Component } from 'react';
import './MovementWizardPage.scss';
import BorderLayout from '../BorderLayout';
import BorderLayoutItem from '../BorderLayoutItem';
import WizardBreadcrumbs from '../WizardBreadcrumbs';
import WizardNavigation from '../WizardNavigation';
import AircraftList from '../AircraftList';
import UserList from '../UserList';
import Firebase from 'firebase';
import { firebaseToLocal, localToFirebase } from '../../util/movements.js';
import update from 'react-addons-update';

class MovementWizardPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      step: 0,
      committed: false,
      data: this.props.defaultData,
      aircraftListVisible: false,
      userListVisible: false,
    };

    if (this.props.movementKey) {
      this.update = true;
    }

    this.handleKeyDown = this.handleKeyDown.bind(this);

    this.aircraftListVisibleFields = {
      'immatriculation': true,
      'aircraftType': true,
    };

    this.userListVisibleFields = {
      'memberNr': true,
    };
  }

  componentWillMount() {
    this.firebaseCollectionRef = new Firebase(this.props.firebaseUri);
    if (this.update === true) {
      this.firebaseCollectionRef.child(this.props.movementKey).on('value', this.onFirebaseValue, this);
    }
    document.addEventListener('keydown', this.handleKeyDown);
    this.mounted = true;
  }

  componentWillUnmount() {
    if (this.update === true) {
      this.firebaseCollectionRef.child(this.props.movementKey).off('value', this.onFirebaseValue, this);
    }
    document.removeEventListener('keydown', this.handleKeyDown);
    this.mounted = false;
  }

  onFirebaseValue(dataSnapshot) {
    const movement = firebaseToLocal(dataSnapshot.val());
    this.setState({
      data: movement,
    });
  }

  commit() {
    const movement = localToFirebase(this.state.data);
    const setCommitted = () => {
      this.setState({
        committed: true,
      });
    };
    if (this.update === true) {
      this.firebaseCollectionRef.child(this.props.movementKey).set(movement, setCommitted);
    } else {
      this.firebaseCollectionRef.push(movement, setCommitted);
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

  focusHandler(e) {
    this.setState({
      aircraftListVisible: e.target && this.aircraftListVisibleFields[e.target.name] === true,
      userListVisible: e.target && this.userListVisibleFields[e.target.name] === true,
    });
  }

  blurHandler() {
    setTimeout(() => {
      if (this.mounted === true) {
        this.setState({
          aircraftListVisible: this.aircraftListVisibleFields[document.activeElement.name] === true,
          userListVisible: this.userListVisibleFields[document.activeElement.name] === true,
        });
      }
    }, 1);
  }

  keyUpHandler(e) {
    if (e.key === 'immatriculation') {
      this.setState({
        immatriculationFilter: e.value,
      });
    }
    if (e.key === 'aircraftType') {
      this.setState({
        aircraftTypeFilter: e.value,
      });
    }
    if (e.key === 'memberNr') {
      this.setState({
        memberNrFilter: e.value,
      });
    }
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

  nextStep() {
    if (this.isLast()) {
      this.commit();
    } else {
      this.setState({
        step: this.state.step + 1,
      });
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

  isFirst() {
    return this.state.step === 0;
  }

  isLast() {
    return this.state.step === (this.props.pages.length - 1);
  }

  buildBreadcrumbItems() {
    const breadcrumbItems = [{
      label: this.props.label,
    }];
    this.props.pages.forEach((page, index) => {
      breadcrumbItems.push({
        label: page.label,
        handler: () => {
          this.setState({ step: index });
        },
      });
    });
    return breadcrumbItems;
  }

  render() {
    const className = 'MovementWizardPage ' + this.props.className;
    const logoImagePath = require('../../resources/mfgt_logo_transp.png');

    let middleItem;
    let northItem;
    let southItem;
    let eastItem;

    if (this.state.committed === true) {
      middleItem = <this.props.finishComponentClass finish={this.finish.bind(this)}/>;
    } else {
      const breadcrumbItems = this.buildBreadcrumbItems();
      const nextLabel = this.isLast() ? 'Speichern' : 'Weiter';

      const page = this.props.pages[this.state.step];
      middleItem = (
        <page.component
          data={this.state.data}
          updateData={this.updateData.bind(this)}
          onKeyUp={this.keyUpHandler.bind(this)}
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
          />
        </BorderLayoutItem>
      );

      if (this.state.aircraftListVisible === true) {
        eastItem = (
          <BorderLayoutItem region="east">
            <AircraftList
              immatriculation={this.state.immatriculationFilter}
              aircraftType={this.state.aircraftTypeFilter}
              onClick={this.aircraftClickHandler.bind(this)}
            />
          </BorderLayoutItem>
        );
      } else if (this.state.userListVisible === true) {
        eastItem = (
          <BorderLayoutItem region="east">
            <UserList
              memberNr={this.state.memberNrFilter}
              onClick={this.userClickHandler.bind(this)}
            />
          </BorderLayoutItem>
        );
      }
    }

    return (
      <BorderLayout className={className} onFocus={this.focusHandler.bind(this)} onBlur={this.blurHandler.bind(this)}>
        <BorderLayoutItem region="west">
          <header>
            <img className="logo" src={logoImagePath}/>
          </header>
        </BorderLayoutItem>
        {northItem}
        <BorderLayoutItem region="middle">
          {middleItem}
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
  defaultData: PropTypes.object,
};

MovementWizardPage.defaultProps = {
  defaultData: {},
};

export default MovementWizardPage;
