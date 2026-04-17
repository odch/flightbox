import React from 'react';

interface PageDialog {
  name: string;
  component: React.ComponentType<{ onCancel: () => void; onConfirm: () => void }>;
}

interface WizardDialogProps {
  dialogConf?: PageDialog;
  isVisible: boolean;
  hideDialog: (name: string) => void;
  getNextAction: () => () => void;
}

const WizardDialog = ({ dialogConf, isVisible, hideDialog, getNextAction }: WizardDialogProps) => {
  if (!dialogConf || !isVisible) {
    return null;
  }

  const DialogComponent = dialogConf.component;
  const nextAction = getNextAction();

  return (
    <DialogComponent
      onCancel={() => hideDialog(dialogConf.name)}
      onConfirm={() => {
        hideDialog(dialogConf.name);
        nextAction();
      }}
    />
  );
};

export default WizardDialog;
