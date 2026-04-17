import useWizardNavigation from './useWizardNavigation';
import { WizardState } from '../../modules/ui/wizard/reducer';

const mockPage = (dialog?: any) => ({
  component: {} as any,
  label: 'Page',
  dialog,
});

const createArgs = (overrides: any = {}) => ({
  pages: overrides.pages || [mockPage(), mockPage()],
  wizard: overrides.wizard || { page: 1, initialized: true, committed: false, values: {}, commitError: null, dialogs: {} } as WizardState,
  updateValues: overrides.updateValues || jest.fn(),
  nextPage: overrides.nextPage || jest.fn(),
  previousPage: overrides.previousPage || jest.fn(),
  saveMovement: overrides.saveMovement || jest.fn(),
  showDialog: overrides.showDialog || jest.fn(),
});

describe('useWizardNavigation', () => {
  describe('getNextAction', () => {
    it('returns nextPage when not on last page', () => {
      const nextPage = jest.fn();
      const saveMovement = jest.fn();
      const { getNextAction } = useWizardNavigation(createArgs({
        wizard: { page: 1 } as WizardState,
        pages: [mockPage(), mockPage()],
        nextPage,
        saveMovement,
      }));

      expect(getNextAction()).toBe(nextPage);
    });

    it('returns saveMovement when on last page', () => {
      const nextPage = jest.fn();
      const saveMovement = jest.fn();
      const { getNextAction } = useWizardNavigation(createArgs({
        wizard: { page: 2 } as WizardState,
        pages: [mockPage(), mockPage()],
        nextPage,
        saveMovement,
      }));

      expect(getNextAction()).toBe(saveMovement);
    });
  });

  describe('goToPreviousPage', () => {
    it('calls updateValues with data and previousPage', () => {
      const updateValues = jest.fn();
      const previousPage = jest.fn();
      const { goToPreviousPage } = useWizardNavigation(createArgs({
        updateValues,
        previousPage,
      }));

      const data = { immatriculation: 'HBABC' };
      goToPreviousPage(data);

      expect(updateValues).toHaveBeenCalledWith(data);
      expect(previousPage).toHaveBeenCalled();
    });
  });

  describe('submitPage', () => {
    it('calls updateValues and nextPage when no dialog configured', () => {
      const updateValues = jest.fn();
      const nextPage = jest.fn();
      const { submitPage } = useWizardNavigation(createArgs({
        updateValues,
        nextPage,
        pages: [mockPage(), mockPage()],
        wizard: { page: 1 } as WizardState,
      }));

      const data = { immatriculation: 'HBABC' };
      submitPage(data);

      expect(updateValues).toHaveBeenCalledWith(data);
      expect(nextPage).toHaveBeenCalled();
    });

    it('calls saveMovement on last page when no dialog configured', () => {
      const updateValues = jest.fn();
      const saveMovement = jest.fn();
      const nextPage = jest.fn();
      const { submitPage } = useWizardNavigation(createArgs({
        updateValues,
        saveMovement,
        nextPage,
        pages: [mockPage(), mockPage()],
        wizard: { page: 2 } as WizardState,
      }));

      submitPage({});

      expect(saveMovement).toHaveBeenCalled();
      expect(nextPage).not.toHaveBeenCalled();
    });

    it('shows dialog when dialog has no predicate', () => {
      const showDialog = jest.fn();
      const nextPage = jest.fn();
      const dialog = { name: 'CONFIRM', component: {} as any };
      const { submitPage } = useWizardNavigation(createArgs({
        showDialog,
        nextPage,
        pages: [mockPage(dialog)],
        wizard: { page: 1 } as WizardState,
      }));

      submitPage({});

      expect(showDialog).toHaveBeenCalledWith('CONFIRM');
      expect(nextPage).not.toHaveBeenCalled();
    });

    it('shows dialog when predicate resolves to true', async () => {
      const showDialog = jest.fn();
      const nextPage = jest.fn();
      const dialog = {
        name: 'CONFIRM',
        component: {} as any,
        predicate: jest.fn().mockResolvedValue(true),
      };
      const { submitPage } = useWizardNavigation(createArgs({
        showDialog,
        nextPage,
        pages: [mockPage(dialog)],
        wizard: { page: 1 } as WizardState,
      }));

      const data = { location: 'LSZT' };
      await submitPage(data);

      expect(dialog.predicate).toHaveBeenCalledWith(data);
      expect(showDialog).toHaveBeenCalledWith('CONFIRM');
      expect(nextPage).not.toHaveBeenCalled();
    });

    it('calls nextPage when predicate resolves to false', async () => {
      const showDialog = jest.fn();
      const nextPage = jest.fn();
      const dialog = {
        name: 'CONFIRM',
        component: {} as any,
        predicate: jest.fn().mockResolvedValue(false),
      };
      const { submitPage } = useWizardNavigation(createArgs({
        showDialog,
        nextPage,
        pages: [mockPage(dialog), mockPage()],
        wizard: { page: 1 } as WizardState,
      }));

      await submitPage({ location: 'LSZT' });

      expect(showDialog).not.toHaveBeenCalled();
      expect(nextPage).toHaveBeenCalled();
    });

    it('calls saveMovement on last page when predicate resolves to false', async () => {
      const saveMovement = jest.fn();
      const nextPage = jest.fn();
      const dialog = {
        name: 'CONFIRM',
        component: {} as any,
        predicate: jest.fn().mockResolvedValue(false),
      };
      const { submitPage } = useWizardNavigation(createArgs({
        saveMovement,
        nextPage,
        pages: [mockPage(dialog)],
        wizard: { page: 1 } as WizardState,
      }));

      await submitPage({});

      expect(saveMovement).toHaveBeenCalled();
      expect(nextPage).not.toHaveBeenCalled();
    });
  });
});
