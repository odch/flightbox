import validateUtil from '../../util/validate';
import dates from '../../util/dates';
import i18n from '../../i18n';

// The date range the server accepts (functions/ppr/domain/pprRequest.js)
const MAX_DAYS_AHEAD = 365;

// Calendar arithmetic on 'YYYY-MM-DD' dates, independent of time zones
const addDays = (date: string, days: number) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
};

const getConfig = () => ({
  firstname: {
    types: {
      required: true,
    },
    message: i18n.t('validate.firstname'),
  },
  lastname: {
    types: {
      required: true,
    },
    message: i18n.t('validate.lastname'),
  },
  immatriculation: {
    types: {
      required: true,
    },
    message: i18n.t('validate.immatriculation'),
  },
  plannedDate: {
    types: {
      required: true,
    },
    message: i18n.t('validate.date'),
  },
  plannedTime: {
    types: {
      required: true,
    },
    message: i18n.t('ppr.validation.plannedTime'),
  },
  flightType: {
    types: {
      required: true,
    },
    message: i18n.t('validate.flightType'),
  },
});

// `today` is the aerodrome's (Zurich) date as 'YYYY-MM-DD'
const validate = (values: Record<string, any>, today: string = dates.localDate()) => {
  const errorArr = validateUtil(values, getConfig());

  const errors: Record<string, string | undefined> = {};

  errorArr.forEach(error => {
    errors[error.key] = error.message;
  });

  // Checked here, as the server would only refuse the request
  const plannedDate = values.plannedDate;
  if (plannedDate && !errors.plannedDate) {
    if (plannedDate < today) {
      errors.plannedDate = i18n.t('ppr.validation.plannedDatePast');
    } else if (plannedDate > addDays(today, MAX_DAYS_AHEAD)) {
      errors.plannedDate = i18n.t('ppr.validation.plannedDateTooFar');
    }
  }

  return errors;
};

export default validate;
