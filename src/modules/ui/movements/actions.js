export const SHOW_DELETE_CONFIRMATION_DIALOG = 'SHOW_DELETE_CONFIRMATION_DIALOG';
export const HIDE_DELETE_CONFIRMATION_DIALOG = 'HIDE_DELETE_CONFIRMATION_DIALOG';
export const SHOW_DEPARTURE_WIZARD = 'SHOW_DEPARTURE_WIZARD';
export const SHOW_ARRIVAL_WIZARD = 'SHOW_ARRIVAL_WIZARD';
export const CREATE_DEPARTURE_FROM_ARRIVAL = 'CREATE_DEPARTURE_FROM_ARRIVAL';
export const CREATE_ARRIVAL_FROM_DEPARTURE = 'CREATE_ARRIVAL_FROM_DEPARTURE';
export const CANCEL_WIZARD = 'CANCEL_WIZARD';

export function showDeleteConfirmationDialog(item) {
  return {
    type: SHOW_DELETE_CONFIRMATION_DIALOG,
    payload: {
      item,
    },
  };
}

export function hideDeleteConfirmationDialog() {
  return {
    type: HIDE_DELETE_CONFIRMATION_DIALOG,
  };
}

export function showDepartureWizard(departureKey) {
  return {
    type: SHOW_DEPARTURE_WIZARD,
    payload: {
      departureKey,
    },
  };
}

export function showArrivalWizard(arrivalKey) {
  return {
    type: SHOW_ARRIVAL_WIZARD,
    payload: {
      arrivalKey,
    },
  };
}

export function createDepartureFromArrival(arrivalKey) {
  return {
    type: CREATE_DEPARTURE_FROM_ARRIVAL,
    payload: {
      arrivalKey,
    },
  };
}

export function createArrivalFromDeparture(departureKey) {
  return {
    type: CREATE_ARRIVAL_FROM_DEPARTURE,
    payload: {
      departureKey,
    },
  };
}

export function cancelWizard() {
  return {
    type: CANCEL_WIZARD,
  }
}
