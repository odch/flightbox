import i18n from '../../i18n';

export const TYPE_LABELS = {
  departure: {
    get label() { return i18n.t('movement.type.departure'); },
    icon: 'flight_takeoff'
  },
  arrival: {
    get label() { return i18n.t('movement.type.arrival'); },
    icon: 'flight_land'
  }
};

export const ACTION_LABELS = {
  departure: {
    get label() { return i18n.t('movement.action.createArrival'); },
    icon: 'flight_land'
  },
  arrival: {
    get label() { return i18n.t('movement.action.createDeparture'); },
    icon: 'flight_takeoff'
  }
};
