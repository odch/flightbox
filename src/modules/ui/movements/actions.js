export const SHOW_DELETE_CONFIRMATION_DIALOG = 'SHOW_DELETE_CONFIRMATION_DIALOG';
export const HIDE_DELETE_CONFIRMATION_DIALOG = 'HIDE_DELETE_CONFIRMATION_DIALOG';
export const CREATE_DEPARTURE_FROM_ARRIVAL = 'CREATE_DEPARTURE_FROM_ARRIVAL';

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

export function createDepartureFromArrival(arrivalKey) {
  return {
    type: CREATE_DEPARTURE_FROM_ARRIVAL,
    payload: {
      arrivalKey,
    },
  };
}
