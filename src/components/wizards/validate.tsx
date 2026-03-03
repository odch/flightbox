import validateUtil from '../../util/validate';
import objectToArray from '../../util/objectToArray';
import {categories as aircraftCategories} from '../../util/aircraftCategories';
import i18n from '../../i18n';

const getConfig = () => ({
  immatriculation: {
    types: {
      required: true,
      match: /^[A-Z0-9]+$/,
    },
    message: i18n.t('validate.immatriculation'),
  },
  aircraftType: {
    types: {
      required: true,
    },
    message: i18n.t('validate.aircraftType'),
  },
  mtow: {
    types: {
      required: true,
      integer: true,
    },
    message: i18n.t('validate.mtow'),
  },
  aircraftCategory: {
    types: {
      required: true,
      values: aircraftCategories
    },
    message: i18n.t('validate.aircraftCategory'),
  },
  lastname: {
    types: {
      required: true,
    },
    message: i18n.t('validate.lastname'),
  },
  firstname: {
    types: {
      required: true,
    },
    message: i18n.t('validate.firstname'),
  },
  email: {
    types: {
      required: true,
      match: /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
    },
    message: i18n.t('validate.email'),
  },
  date: {
    types: {
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    message: i18n.t('validate.date'),
  },
  time: {
    types: {
      required: true,
      match: /^\d{2}:\d{2}$/,
    },
    message: {
      departure: i18n.t('validate.timeDeparture'),
      arrival: i18n.t('validate.timeArrival'),
    },
  },
  location: {
    types: {
      required: true,
    },
    message: {
      departure: i18n.t('validate.locationDeparture'),
      arrival: i18n.t('validate.locationArrival'),
    },
  },
  duration: {
    types: {
      required: true,
      match: /^\d{2}:\d{2}$/,
    },
    message: i18n.t('validate.duration'),
  },
  flightType: {
    types: {
      required: true,
      values: objectToArray(__CONF__.enabledFlightTypes),
    },
    message: i18n.t('validate.flightType'),
  },
  runway: {
    types: {
      required: true,
      values: (objectToArray(__CONF__.aerodrome.runways) as any[]).map(runway => runway.name),
    },
    message: {
      departure: i18n.t('validate.runwayDeparture'),
      arrival: i18n.t('validate.runwayArrival'),
    },
  },
  departureRoute: {
    types: {
      required: true,
      values: (objectToArray(__CONF__.aerodrome.departureRoutes) as any[]).map(route => route.name).concat('circuits'),
    },
    message: i18n.t('validate.departureRoute'),
  },
  arrivalRoute: {
    types: {
      required: true,
      values: (objectToArray(__CONF__.aerodrome.arrivalRoutes) as any[]).map(route => route.name).concat('circuits'),
    },
    message: i18n.t('validate.arrivalRoute'),
  },
  landingCount: {
    types: {
      required: true,
      integer: true,
    },
    message: i18n.t('validate.landingCount'),
  },
});

const getFilteredConfig = (fields: string[] = []) => {
  const config = getConfig();
  return Object.keys(config)
    .filter(key => fields.includes(key))
    .reduce((obj, key) => {
      obj[key] = config[key];
      return obj;
    }, {});
};

const getRelevantFields = (fields: string[], hiddenFields: string[] = []) => {
  if (hiddenFields.length === 0) {
    return fields
  }
  return fields.filter(field => !hiddenFields.includes(field))
}

const validate = (type, fields, hiddenFields) => (values) => {
  const relevantFields = getRelevantFields(fields, hiddenFields)
  const errorArr = validateUtil(values, getFilteredConfig(relevantFields), type);

  const errors = {};

  errorArr.forEach(error => {
    errors[error.key] = error.message;
  });

  return errors;
};

export default validate;
