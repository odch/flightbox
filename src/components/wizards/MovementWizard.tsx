import React, {useEffect} from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import CommitFailureDialog from '../CommitFailureDialog';
import Centered from '../Centered';
import VerticalHeaderLayout from '../VerticalHeaderLayout';
import MaterialIcon from '../MaterialIcon';
import {getFromItemKey} from '../../util/reference-number';
import Breadcrumbs from './Breadcrumbs';
import { WizardState } from '../../modules/ui/wizard/reducer';
import useWizardNavigation from './useWizardNavigation';
import WizardDialog from './WizardDialog';

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

interface MovementWizardProps {
  pages: WizardPage[];
  finishComponentClass: React.ComponentType<any>;
  wizard: WizardState;
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

const MovementWizard = (props: MovementWizardProps) => {
  const { t } = useTranslation();
  const params = useParams<{ key?: string }>();

  useEffect(() => {
    props.loadLockDate();
    props.loadAircraftSettings();
    if (typeof props.initMovement === 'function') {
      props.initMovement();
    } else if (params.key) {
      props.editMovement(params.key);
    } else {
      props.initNewMovement();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isUpdate = typeof params.key === 'string' && params.key.length > 0;

  const breadcrumbItems = props.pages.map(page => ({
    label: page.label,
  }));

  const { goToPreviousPage, submitPage, getNextAction } = useWizardNavigation({
    pages: props.pages,
    wizard: props.wizard,
    updateValues: props.updateValues,
    nextPage: props.nextPage,
    previousPage: props.previousPage,
    saveMovement: props.saveMovement,
    showDialog: props.showDialog,
  });

  const currentPageDialog = props.pages[props.wizard.page - 1].dialog;

  const getMiddleItem = () => {
    if (props.wizard.initialized !== true || props.lockDateLoading === true) {
      return <Centered><MaterialIcon icon="sync" rotate="left"/> {t('wizard.loading')}</Centered>;
    }

    if (props.wizard.committed === true) {
      const FinishComponent = props.finishComponentClass;
      return <FinishComponent
        finish={props.finish}
        isUpdate={isUpdate}
        headingType={isUpdate ? HeadingType.UPDATED : HeadingType.CREATED}
      />;
    }

    const pageObj = props.pages[props.wizard.page - 1];
    const pageComponent = (
      <pageObj.component
        previousPage={goToPreviousPage}
        onSubmit={submitPage}
        cancel={props.cancel}
        readOnly={props.locked}
        isAdmin={props.auth.data.admin}
        isGuest={props.auth.data.guest}
        formValues={props.wizard.values}
      />
    );

    const dialog = (
      <WizardDialog
        dialogConf={currentPageDialog}
        isVisible={!!(currentPageDialog && props.wizard.dialogs[currentPageDialog.name])}
        hideDialog={props.hideDialog}
        getNextAction={getNextAction}
      />
    );

    const commitFailureDialog = props.wizard.commitError
      ? (
        <CommitFailureDialog
          onClose={props.unsetCommitError}
          errorMsg={(props.wizard.commitError as any).message}
        />
      ) : null;

    return (
      <div>
        {pageComponent}
        {dialog}
        {commitFailureDialog}
      </div>
    );
  };

  const breadcrumbsTitle = isUpdate
    ? props.updateMovementLabel + ' (' + getFromItemKey(params.key as string) + ')'
    : props.newMovementLabel;

  return (
    <VerticalHeaderLayout>
      <div>
        {props.wizard.initialized === true && props.wizard.committed !== true &&
          <Breadcrumbs title={breadcrumbsTitle} items={breadcrumbItems} activeItem={props.wizard.page - 1}/>}
        <div>{getMiddleItem()}</div>
      </div>
    </VerticalHeaderLayout>
  );
};

export default MovementWizard;
