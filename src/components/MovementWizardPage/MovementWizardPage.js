import React, { PropTypes, Component } from 'react';
import { connectLifecycle } from 'react-router-ad-hocs';
import './MovementWizardPage.scss';
import BorderLayout from '../BorderLayout';
import BorderLayoutItem from '../BorderLayoutItem';
import WizardBreadcrumbs from '../WizardBreadcrumbs';
import WizardNavigation from '../WizardNavigation';
import CommitFailure from '../CommitFailure';
import FullscreenFilterList from '../FullscreenFilterList';
import CancelConfirmationDialog from '../CancelConfirmationDialog';
import firebase from '../../util/firebase.js';
import { firebaseToLocal, localToFirebase, isLocked } from '../../util/movements.js';
import update from 'react-addons-update';
import { getVisibleListByField, getVisibleListByStep } from './quick-selection-conf.js';

class MovementWizardPage extends Component {

  constructor(props) {
    super(props);

    this.state = {
      step: 0,
      changed: false,
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
    this.routerWillLeave = this.routerWillLeave.bind(this);
  }

  componentWillMount() {
    firebase((error, ref) => {
      this.firebaseLockDateRef = ref.child('/settings/lockDate');
      this.firebaseLockDateRef.on('value', this.onLockDateValue, this);

      this.firebaseCollectionRef = ref.child(this.props.firebaseUri);
      if (this.update === true) {
        this.firebaseCollectionRef.child(this.props.movementKey).on('value', this.onFirebaseValue, this);
      }
    });

    document.addEventListener('keydown', this.handleKeyDown);

    const mql = matchMedia('screen and (max-width: 768px)');
    this.setState({
      smallDevice: mql.matches,
    });
    mql.addListener(this.onMediaChange.bind(this));

    this.mounted = true;
  }

  componentWillUnmount() {
    if (this.firebaseLockDateRef) {
      this.firebaseLockDateRef.off('value', this.onLockDateValue, this);
    }
    if (this.update === true && this.firebaseCollectionRef) {
      this.firebaseCollectionRef.child(this.props.movementKey).off('value', this.onFirebaseValue, this);
    }
    document.removeEventListener('keydown', this.handleKeyDown);
    this.mounted = false;
  }

  onMediaChange(mql) {
    this.setState({
      smallDevice: mql.matches,
    });
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

  routerWillLeave() {
    if (this.state.changed === true && this.state.cancelConfirmed !== true) {
      this.setState({
        showCancelConfirmation: true,
      });
      return false;
    }
    return true;
  }

  cancelConfirmationCancelHandler() {
    this.setState({
      showCancelConfirmation: false,
    });
  }

  cancelConfirmationConfirmHandler() {
    this.setState({
      showCancelConfirmation: false,
      cancelConfirmed: true,
    }, () => {
      window.location.hash = '/';
    });
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
      changed: true,
      data,
    });
  }

  focusHandler(e) {
    const fieldName = e.target ? e.target.name : null;
    if (this.state.smallDevice === true && fieldName) {
      const list = getVisibleListByField(fieldName);
      if (list) {
        this.setState({
          fullscreenList: list,
        });
      }
    }
  }

  blurHandler() {
    setTimeout(() => {
      if (this.mounted === true) {
        const activeElementName = document.activeElement.name;
        this.setState({
          selectedField: activeElementName,
        });
      }
    }, 1);
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

    if (this.state.committed === true) {
      const middleItem = (
        <this.props.finishComponentClass
          itemKey={this.movementKey}
          finish={this.finish.bind(this)}
          update={this.update}
        />);
      return (
        <BorderLayout className={className}>
          <BorderLayoutItem region="west">
            <header>
              <a href="#/">
                <img className="logo" src={logoImagePath}/>
              </a>
            </header>
          </BorderLayoutItem>
          <BorderLayoutItem region="middle">
            {middleItem}
          </BorderLayoutItem>
        </BorderLayout>
      );
    }

    if (this.state.commitError) {
      const middleItem = (
        <CommitFailure
          errorMsg={this.state.commitError.message}
          back={this.unsetCommitError.bind(this)}
        />
      );
      return (
        <BorderLayout className={className}>
          <BorderLayoutItem region="west">
            <header>
              <a href="#/">
                <img className="logo" src={logoImagePath}/>
              </a>
            </header>
          </BorderLayoutItem>
          <BorderLayoutItem region="middle">
            {middleItem}
          </BorderLayoutItem>
        </BorderLayout>
      );
    }

    const breadcrumbItems = this.buildBreadcrumbItems();
    const nextLabel = this.isLast() ? 'Speichern' : 'Weiter';

    const page = this.props.pages[this.state.step];
    const middleItem = (
      <page.component
        data={this.state.data}
        oppositeData={this.props.oppositeData}
        updateData={this.updateData.bind(this)}
        ref="page"
        showValidationErrors={this.state.showValidationErrors === true}
        itemKey={this.movementKey}
        update={this.update}
        readOnly={locked}
      />
    );

    const northItem = (
      <BorderLayoutItem region="north">
        <WizardBreadcrumbs items={breadcrumbItems} activeItem={this.state.step + 1}/>
      </BorderLayoutItem>
    );
    const southItem = (
      <BorderLayoutItem region="south">
        <WizardNavigation
          cancel={this.cancel.bind(this)}
          previousStep={this.previousStep.bind(this)}
          nextStep={this.nextStep.bind(this)}
          nextLabel={nextLabel}
          nextVisible={!(this.isLast() && locked)}
          previousVisible={!this.isFirst()}
        />
      </BorderLayoutItem>
    );

    const commitRequirements = this.state.showCommitRequirements === true
      ? (
        <this.props.commitRequirementsDialogClass
          onCancel={this.confirmRequirementsCancelHandler.bind(this)}
          onConfirm={this.confirmRequirementsConfirmHandler.bind(this)}
        />
      )
      : null;

    const cancelConfirmation = this.state.showCancelConfirmation === true
      ? (
        <CancelConfirmationDialog
          onCancel={this.cancelConfirmationCancelHandler.bind(this)}
          onConfirm={this.cancelConfirmationConfirmHandler.bind(this)}
        />
      )
      : null;

    if (this.state.smallDevice === true) {
      return (
        <div onFocus={this.focusHandler.bind(this)} onBlur={this.blurHandler.bind(this)}>
          <BorderLayout className={className}>
            {northItem}
            <BorderLayoutItem region="middle">
              {middleItem}
              {commitRequirements}
              {cancelConfirmation}
            </BorderLayoutItem>
            {southItem}
          </BorderLayout>
          {this.state.fullscreenList
            ? (
              <FullscreenFilterList
                listComponent={this.state.fullscreenList.component}
                filterProp={this.state.fullscreenList.filterProp}
                filterValue={this.state.data[this.state.fullscreenList.fieldName]}
                inputLabel={this.state.fullscreenList.fieldLabel}
                emptyMessage={this.state.fullscreenList.emptyMessage}
                onClick={item => {
                  const newData = this.state.fullscreenList.clickHandler(this.state.data, item);
                  this.setState({
                    data: newData,
                    fullscreenList: null,
                  });
                }}
                onBackClick={() => {
                  this.setState({
                    fullscreenList: null,
                  });
                }}
              />)
            : null}
        </div>
      );
    }

    let quickSelectionList;

    const listConf = getVisibleListByStep(this.state.step);
    if (listConf) {
      const listProps = {
        onClick: item => {
          const newData = listConf.clickHandler(this.state.data, item);
          this.setState({
            data: newData,
          });
        },
      };
      listConf.fields.forEach(field => {
        const fieldName = field.field;
        const filterProp = field.filterProp;
        listProps[filterProp] = this.state.data[fieldName];
      });
      quickSelectionList = <listConf.component {...listProps}/>;
    }

    return (
      <div onFocus={this.focusHandler.bind(this)} onBlur={this.blurHandler.bind(this)}>
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
            {cancelConfirmation}
          </BorderLayoutItem>
          {southItem}
          {quickSelectionList
            ? (
              <BorderLayoutItem region="east">
                {quickSelectionList}
              </BorderLayoutItem>
            )
            : null}
        </BorderLayout>
      </div>
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

export default connectLifecycle(MovementWizardPage);
