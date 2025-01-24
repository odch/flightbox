import PropTypes from 'prop-types';
import React, {Component} from 'react';
import CommitFailureDialog from '../CommitFailureDialog';
import Centered from '../Centered';
import VerticalHeaderLayout from '../VerticalHeaderLayout';
import MaterialIcon from '../MaterialIcon';
import {getFromItemKey} from '../../util/reference-number';
import Breadcrumbs from './Breadcrumbs';

class MovementWizard extends Component {

  componentWillMount() {
    this.props.loadLockDate();
    this.props.loadAircraftSettings();
    if (typeof this.props.initMovement === 'function') {
      this.props.initMovement();
    } else if (this.props.match.params.key) {
      this.props.editMovement(this.props.match.params.key);
    } else {
      this.props.initNewMovement();
    }
  }

  render() {
    const breadcrumbsTitle = this.isUpdate()
      ? this.props.updateMovementLabel + ' (' + getFromItemKey(this.props.match.params.key) + ')'
      : this.props.newMovementLabel;
    return (
      <VerticalHeaderLayout>
        <div>
          {this.props.wizard.initialized === true && this.props.wizard.committed !== true &&
            <Breadcrumbs title={breadcrumbsTitle} items={this.buildBreadcrumbItems()} activeItem={this.props.wizard.page - 1}/>}
          <div>{this.getMiddleItem()}</div>
        </div>
      </VerticalHeaderLayout>
    );
  }

  getMiddleItem() {
    if (this.props.wizard.initialized !== true || this.props.lockDateLoading === true) {
      return <Centered><MaterialIcon icon="sync" rotate="left"/> Bitte warten ...</Centered>;
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
        isAdmin={this.props.auth.data.admin}
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
    return this.props.pages.map(page => ({
      label: page.label,
    }));
  }

  isUpdate() {
    return typeof this.props.match.params.key === 'string' && this.props.match.params.key.length > 0;
  }
}

MovementWizard.propTypes = {
  pages: PropTypes.arrayOf(PropTypes.shape({
    component: PropTypes.func.isRequired,
    label: PropTypes.string.isRequired,
    dialog: PropTypes.shape({
      name: PropTypes.string.isRequired,
      component: PropTypes.func.isRequired,
      predicate: PropTypes.func,
    })
  })).isRequired,
  finishComponentClass: PropTypes.func.isRequired,
  wizard: PropTypes.object.isRequired,
  match: PropTypes.shape({
    params: PropTypes.object.isRequired
  }).isRequired,
  newMovementLabel: PropTypes.string.isRequired,
  updateMovementLabel: PropTypes.string.isRequired,
  lockDateLoading: PropTypes.bool.isRequired,
  locked: PropTypes.bool.isRequired,
  className: PropTypes.string,

  initNewMovement: PropTypes.func.isRequired,
  editMovement: PropTypes.func.isRequired,
  initMovement: PropTypes.func,
  nextPage: PropTypes.func.isRequired,
  previousPage: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired,
  finish: PropTypes.func.isRequired,
  showDialog: PropTypes.func,
  hideDialog: PropTypes.func,
  saveMovement: PropTypes.func.isRequired,
  unsetCommitError: PropTypes.func,
  destroyForm: PropTypes.func.isRequired,
  loadLockDate: PropTypes.func.isRequired,
  loadAircraftSettings: PropTypes.func.isRequired,
};

export default MovementWizard;
