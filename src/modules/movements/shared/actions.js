export const START_INITIALIZE_WIZARD = 'START_INITIALIZE_WIZARD';
export const WIZARD_INITIALIZED = 'WIZARD_INITIALIZED';

export function startInitializeWizard() {
  return {
    type: START_INITIALIZE_WIZARD,
  };
}

export function wizardInitialized() {
  return {
    type: WIZARD_INITIALIZED,
  };
}
