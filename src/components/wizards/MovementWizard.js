import React, { Component } from 'react';
import CommitFailureDialog from '../CommitFailureDialog';
import Centered from '../Centered';
import VerticalHeaderLayout from '../VerticalHeaderLayout';
import { getFromItemKey } from '../../util/reference-number';
import Breadcrumbs from './Breadcrumbs';
import Content from './Content';

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
      <VerticalHeaderLayout>
        <div>
          {this.props.wizard.initialized === true && this.props.wizard.committed !== true &&
            <Breadcrumbs items={this.buildBreadcrumbItems()} activeItem={this.props.wizard.page}/>}
          <Content>{this.getMiddleItem()}</Content>
        </div>
      </VerticalHeaderLayout>
    );
  }

  getMiddleItem() {
    if (this.props.wizard.initialized !== true || this.props.lockDateLoading === true) {
      return <Centered>Bitte warten ...</Centered>;
    }

    if (this.props.wizard.committed === true) {
      return <this.props.finishComponentClass finish={this.props.finish} isUpdate={this.isUpdate()}/>;
    }

    const pageObj = this.props.pages[this.props.wizard.page - 1];
    const pageComponent = (
      <pageObj.component
        previousPage={this.props.previousPage}
        onSubmit={this.submitPage.bind(this)}
        cancel={this.props.cancel}
        readOnly={this.props.locked}
      />
    );

    const dialog = this.getDialog();

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
        {dialog}
        {commitFailureDialog}
      </div>
    );
  }

  getDialog() {
    const dialogConf = this.props.pages[this.props.wizard.page - 1].dialog;
    if (dialogConf && this.props.wizard.dialogs[dialogConf.name] === true) {
      const isLast = this.props.wizard.page === this.props.pages.length;
      const nextAction = isLast
        ? this.props.saveMovement
        : this.props.nextPage;
      return (
        <dialogConf.component
          onCancel={this.props.hideDialog.bind(null, dialogConf.name)}
          onConfirm={() => {
            this.props.hideDialog(dialogConf.name);
            nextAction();
          }}
        />
      );
    }
    return null;
  }

  submitPage(data) {
    const isLast = this.props.wizard.page === this.props.pages.length;

    const nextAction = isLast
      ? this.props.saveMovement
      : this.props.nextPage;

    const dialogConf = this.props.pages[this.props.wizard.page - 1].dialog;

    if (!dialogConf) {
      nextAction();
      return;
    }

    if (!dialogConf.predicate) {
      this.props.showDialog(dialogConf.name);
      return;
    }

    dialogConf.predicate(data).then(show => {
      if (show === true) {
        this.props.showDialog(dialogConf.name);
      } else {
        nextAction();
      }
    });
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
    dialog: React.PropTypes.shape({
      name: React.PropTypes.string.isRequired,
      component: React.PropTypes.func.isRequired,
      predicate: React.PropTypes.func,
    })
  })).isRequired,
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
  cancel: React.PropTypes.func.isRequired,
  finish: React.PropTypes.func.isRequired,
  showDialog: React.PropTypes.func,
  hideDialog: React.PropTypes.func,
  saveMovement: React.PropTypes.func.isRequired,
  unsetCommitError: React.PropTypes.func,
  destroyForm: React.PropTypes.func.isRequired,
  loadLockDate: React.PropTypes.func.isRequired,
};

MovementWizard.contextTypes = {
  router: React.PropTypes.object.isRequired,
};

export default MovementWizard;
