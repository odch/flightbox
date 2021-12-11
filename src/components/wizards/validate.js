import validateUtil from '../../util/validate';
import objectToArray from '../../util/objectToArray';

const config = {
  immatriculation: {
    types: {
      required: true,
      match: /^[A-Z0-9]+$/,
    },
    message: 'Geben Sie hier die Immatrikulation des Flugzeugs ein. ' +
    'Sie darf nur Grossbuchstaben und Zahlen enthalten.',
  },
  aircraftType: {
    types: {
      required: true,
    },
    message: 'Geben Sie hier den Typ des Flugzeugs ein.',
  },
  mtow: {
    types: {
      required: true,
      integer: true,
    },
    message: 'Geben Sie hier das maximale Abfluggewicht des Flugzeugs ein (in Kilogramm).',
  },
  lastname: {
    types: {
      required: true,
    },
    message: 'Geben Sie hier den Nachnamen des Piloten ein.',
  },
  firstname: {
    types: {
      required: true,
    },
    message: 'Geben Sie hier den Vornamen des Piloten ein.',
  },
  date: {
    types: {
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    message: 'Geben Sie hier das Datum ein.',
  },
  time: {
    types: {
      required: true,
      match: /^\d{2}:\d{2}$/,
    },
    message: {
      departure: 'Geben Sie hier die Startzeit in Stunden und Minuten ein (Lokalzeit).',
      arrival: 'Geben Sie hier die Landezeit in Stunden und Minuten ein (Lokalzeit).',
    },
  },
  location: {
    types: {
      required: true,
    },
    message: {
      departure: 'Geben Sie hier den Zielflugplatz ein. Wenn der Flugplatz ein ICAO-Kürzel besitzt,' +
        'verwenden Sie dieses.',
      arrival: 'Geben Sie hier den Startflugplatz ein. Wenn der Flugplatz ein ICAO-Kürzel besitzt,' +
      'verwenden Sie dieses.',
    },
  },
  duration: {
    types: {
      required: true,
      match: /^\d{2}:\d{2}$/,
    },
    message: 'Geben Sie hier die Dauer des Fluges in Stunden und Minuten ein.',
  },
  flightType: {
    types: {
      required: true,
      values: objectToArray(__CONF__.enabledFlightTypes),
    },
    message: 'Wählen Sie hier den Typ des Fluges aus.',
  },
  runway: {
    types: {
      required: true,
      values: objectToArray(__CONF__.aerodrome.runways),
    },
    message: {
      departure: 'Wählen Sie hier die Pistenrichtung für den Abflug aus.',
      arrival: 'Wählen Sie hier die Pistenrichtung für die Landung aus.',
    },
  },
  departureRoute: {
    types: {
      required: true,
      values: objectToArray(__CONF__.aerodrome.departureRoutes).map(route => route.name).concat('circuits'),
    },
    message: 'Wählen Sie hier die Abflugroute aus.',
  },
  arrivalRoute: {
    types: {
      required: true,
      values: objectToArray(__CONF__.aerodrome.arrivalRoutes).map(route => route.name).concat('circuits'),
    },
    message: 'Wählen Sie hier die Ankunftsroute aus.',
  },
  landingCount: {
    types: {
      required: true,
      integer: true,
    },
    message: 'Geben Sie hier die Anzahl Landungen ein.',
  },
};

const getConfig = (fields = []) => Object.keys(config)
  .filter(key => fields.includes(key))
  .reduce((obj, key) => {
    obj[key] = config[key];
    return obj;
  }, {});

const getRelevantFields = (fields, hiddenFields = []) => {
  if (hiddenFields.length === 0) {
    return fields
  }
  return fields.filter(field => !hiddenFields.includes(field))
}

const validate = (type, fields) => (values, props) => {
  const relevantFields = getRelevantFields(fields, props.hiddenFields)
  const errorArr = validateUtil(values, getConfig(relevantFields), type);

  const errors = {};

  errorArr.forEach(error => {
    errors[error.key] = error.message;
  });

  return errors;
};

export default validate;
