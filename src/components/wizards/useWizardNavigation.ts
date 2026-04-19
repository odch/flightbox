import { WizardPage } from './MovementWizard';
import { WizardState } from '../../modules/ui/wizard/reducer';

interface UseWizardNavigationArgs {
  pages: WizardPage[];
  wizard: WizardState;
  updateValues: (values: Record<string, unknown>) => void;
  nextPage: () => void;
  previousPage: () => void;
  saveMovement: () => void;
  showDialog: (name: string) => void;
}

export default function useWizardNavigation({
  pages, wizard, updateValues, nextPage, previousPage,
  saveMovement, showDialog
}: UseWizardNavigationArgs) {
  const getNextAction = () =>
    wizard.page === pages.length ? saveMovement : nextPage;

  const goToPreviousPage = (data: Record<string, unknown>) => {
    updateValues(data)
    previousPage()
  };

  const submitPage = (data: Record<string, unknown>) => {
    updateValues(data)

    const nextAction = getNextAction();

    const dialogConf = pages[wizard.page - 1].dialog;

    if (!dialogConf) {
      nextAction();
      return;
    }

    if (!dialogConf.predicate) {
      showDialog(dialogConf.name);
      return;
    }

    return dialogConf.predicate(data).then(show => {
      if (show === true) {
        showDialog(dialogConf.name);
      } else {
        nextAction();
      }
    });
  };

  return { goToPreviousPage, submitPage, getNextAction };
}
