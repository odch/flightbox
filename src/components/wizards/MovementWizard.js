import React, { Component } from 'react';
import classNames from 'classnames';
import BorderLayout from '../BorderLayout';
import BorderLayoutItem from '../BorderLayoutItem';
import WizardBreadcrumbs from '../WizardBreadcrumbs';
import CommitFailureDialog from '../CommitFailureDialog';
import Logo from '../Logo';
import { getFromItemKey } from '../../util/reference-number';
import './MovementWizard.scss';

class MovementWizard extends Component {

  componentWillMount() {
    this.props.loadLockDate();
    if (typeof this.props.initMovement === 'function') {
      this.props.initMovement();
    } else if (this.props.params.key) {
      this.props.editMovement(this.props.params.key);
    } else {
      this.props.initNewMovement();
    }
  }

  render() {
    return (
      <BorderLayout className={classNames('MovementWizard', this.props.className)}>
        <BorderLayoutItem region="west">
          <header>
            <a href="#/">
              <Logo className="logo"/>
            </a>
          </header>
        </BorderLayoutItem>
        {this.props.wizard.initialized === true && this.props.wizard.committed !== true && (
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
    if (this.props.wizard.initialized !== true || this.props.lockDateLoading === true) {
      return <div className="loading">Bitte warten ...</div>;
    }

    if (this.props.wizard.committed === true) {
      return <this.props.finishComponentClass finish={this.props.finish} isUpdate={this.isUpdate()}/>;
    }

    const isLast = this.props.wizard.page === this.props.pages.length;

    const submitHandler = this.getSubmitHandler(isLast);

    const pageObj = this.props.pages[this.props.wizard.page - 1];
    const pageComponent = (
      <pageObj.component
        previousPage={this.props.previousPage}
        onSubmit={submitHandler}
        readOnly={this.props.locked}
      />
    );

    const commitRequirementsDialog = isLast && this.props.wizard.showCommitRequirementsDialog === true
      ? (
        <this.props.commitRequirementsDialogClass
          onCancel={this.props.hideCommitRequirementsDialog}
          onConfirm={this.props.saveMovement}
        />
      ) : null;

    const commitFailureDialog = this.props.wizard.commitError
      ? (
        <CommitFailureDialog
          onClose={this.props.unsetCommitError}
          errorMsg={this.props.wizard.commitError.message}
        />
      ) : null;

    return (
      <div>
        {pageComponent}
        {commitRequirementsDialog}
        {commitFailureDialog}
      </div>
    );
  }

  getSubmitHandler(isLast) {
    if (isLast) {
      if (this.isUpdate() || !this.props.showCommitRequirementsDialog) {
        return this.props.saveMovement;
      } else {
        return this.props.showCommitRequirementsDialog;
      }
    } else {
      return this.props.nextPage;
    }
  }

  buildBreadcrumbItems() {
    const label = this.isUpdate()
      ? this.props.updateMovementLabel + ' (' + getFromItemKey(this.props.params.key) + ')'
      : this.props.newMovementLabel;

    return [{
      label,
    }].concat(this.props.pages.map(page => ({
      label: page.label,
    })));
  }

  isUpdate() {
    return typeof this.props.params.key === 'string' && this.props.params.key.length > 0;
  }
}

MovementWizard.propTypes = {
  pages: React.PropTypes.arrayOf(React.PropTypes.shape({
    component: React.PropTypes.func.isRequired,
    label: React.PropTypes.string.isRequired,
  })).isRequired,
  commitRequirementsDialogClass: React.PropTypes.func,
  finishComponentClass: React.PropTypes.func.isRequired,
  wizard: React.PropTypes.object.isRequired,
  params: React.PropTypes.object.isRequired,
  newMovementLabel: React.PropTypes.string.isRequired,
  updateMovementLabel: React.PropTypes.string.isRequired,
  lockDateLoading: React.PropTypes.bool.isRequired,
  locked: React.PropTypes.bool.isRequired,
  className: React.PropTypes.string,

  initNewMovement: React.PropTypes.func.isRequired,
  editMovement: React.PropTypes.func.isRequired,
  initMovement: React.PropTypes.func,
  nextPage: React.PropTypes.func.isRequired,
  previousPage: React.PropTypes.func.isRequired,
  finish: React.PropTypes.func.isRequired,
  showCommitRequirementsDialog: React.PropTypes.func,
  hideCommitRequirementsDialog: React.PropTypes.func,
  saveMovement: React.PropTypes.func.isRequired,
  unsetCommitError: React.PropTypes.func,
  destroyForm: React.PropTypes.func.isRequired,
  loadLockDate: React.PropTypes.func.isRequired,
};

MovementWizard.contextTypes = {
  router: React.PropTypes.object.isRequired,
};

export default MovementWizard;
