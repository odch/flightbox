import React, {Component} from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import CommitFailureDialog from '../CommitFailureDialog';
import Centered from '../Centered';
import VerticalHeaderLayout from '../VerticalHeaderLayout';
import MaterialIcon from '../MaterialIcon';
import {getFromItemKey} from '../../util/reference-number';
import Breadcrumbs from './Breadcrumbs';
import { WizardState } from '../../modules/ui/wizard/reducer';

export const HeadingType = {
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  NONE: 'NONE'
};

interface PageDialog {
  name: string;
  component: React.ComponentType<{ onCancel: () => void; onConfirm: () => void }>;
  predicate?: (data: Record<string, unknown>) => Promise<boolean>;
}

export interface WizardPage {
  component: React.ComponentType<any>;
  label: string;
  dialog?: PageDialog;
}

interface MovementWizardProps extends WithTranslation {
  pages: WizardPage[];
  finishComponentClass: React.ComponentType<any>;
  wizard: WizardState;
  match: { params: Record<string, string> };
  auth: { data: { admin: boolean; guest: boolean } };
  newMovementLabel: string;
  updateMovementLabel: string;
  lockDateLoading: boolean;
  locked: boolean;
  className?: string;

  initNewMovement: () => void;
  editMovement: (key: string) => void;
  initMovement?: (() => void) | null;
  updateValues: (values: Record<string, unknown>) => void;
  nextPage: () => void;
  previousPage: () => void;
  cancel: () => void;
  finish: () => void;
  showDialog: (name: string) => void;
  hideDialog: (name: string) => void;
  saveMovement: () => void;
  unsetCommitError: () => void;
  loadLockDate: () => void;
  loadAircraftSettings: () => void;
}

class MovementWizard extends Component<MovementWizardProps> {

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
      const { t } = this.props;
      return <Centered><MaterialIcon icon="sync" rotate="left"/> {t('wizard.loading')}</Centered>;
    }

    if (this.props.wizard.committed === true) {
      return <this.props.finishComponentClass
        finish={this.props.finish}
        isUpdate={this.isUpdate()}
        headingType={this.isUpdate() ? HeadingType.UPDATED : HeadingType.CREATED}
      />;
    }

    const pageObj = this.props.pages[this.props.wizard.page - 1];
    const pageComponent = (
      <pageObj.component
        previousPage={this.goToPreviousPage.bind(this)}
        onSubmit={this.submitPage.bind(this)}
        cancel={this.props.cancel}
        readOnly={this.props.locked}
        isAdmin={this.props.auth.data.admin}
        isGuest={this.props.auth.data.guest}
        formValues={this.props.wizard.values}
      />
    );

    const dialog = this.getDialog();

    const commitFailureDialog = this.props.wizard.commitError
      ? (
        <CommitFailureDialog
          onClose={this.props.unsetCommitError}
          errorMsg={(this.props.wizard.commitError as any).message}
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

  getDialog() {
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

  goToPreviousPage(data: Record<string, unknown>) {
    this.props.updateValues(data)
    this.props.previousPage()
  }

  submitPage(data: Record<string, unknown>) {
    this.props.updateValues(data)

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

    return dialogConf.predicate(data).then(show => {
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

export default withTranslation()(MovementWizard);
