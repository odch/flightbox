import validateUtil from '../../util/validate';
import dates from '../../util/dates';
import { isSendableEmail } from '../../util/emails';
import { categories as aircraftCategories } from '../../util/aircraftCategories';
import i18n from '../../i18n';
import type { PprClosure } from '../../modules/ppr/actions';

// The date range and the largest MTOW the server accepts
// (functions/ppr/domain/pprRequest.js)
const MAX_DAYS_AHEAD = 365;
const MAX_MTOW = 1000000;

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
  // As when recording the movement: type, MTOW and category, which the
  // pilot declares and automatic answers go by
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
  // It also decides which flight types fit
  aircraftCategory: {
    types: {
      required: true,
      values: aircraftCategories,
    },
    message: i18n.t('validate.aircraftCategory'),
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

// `today` is the aerodrome's (Zurich) date as 'YYYY-MM-DD'; requests for the
// days of the closures are rejected
const validate = (values: Record<string, any>, today: string = dates.localDate(), closures: PprClosure[] = []) => {
  const errorArr = validateUtil(values, getConfig());

  const errors: Record<string, string | undefined> = {};

  errorArr.forEach(error => {
    errors[error.key] = error.message;
  });

  // Above 0, as on the server
  if (!errors.mtow && (values.mtow <= 0 || values.mtow > MAX_MTOW)) {
    errors.mtow = i18n.t('validate.mtow');
  }

  // Checked here, as the server would only refuse the request
  const plannedDate = values.plannedDate;
  if (plannedDate && !errors.plannedDate) {
    if (plannedDate < today) {
      errors.plannedDate = i18n.t('ppr.validation.plannedDatePast');
    } else if (plannedDate > addDays(today, MAX_DAYS_AHEAD)) {
      errors.plannedDate = i18n.t('ppr.validation.plannedDateTooFar');
    } else {
      // The server rejects the request with the reason of the first one
      const closure = closures.find(c => c.from <= plannedDate && plannedDate <= c.to);
      if (closure) {
        errors.plannedDate = i18n.t('ppr.validation.plannedDateBlocked', { reason: closure.reason });
      }
    }
  }

  return errors;
};

// Without a login the pilot enters the address the emails about the request
// go to (with a login they go to the login's address). Checked by the
// server's rule, which would refuse the request.
export const validateWithoutLogin = (
  values: Record<string, any>,
  today: string = dates.localDate(),
  closures: PprClosure[] = []
) => {
  const errors = validate(values, today, closures);
  const email = typeof values.email === 'string' ? values.email.trim() : '';
  if (email === '') {
    errors.email = i18n.t('validate.email');
  } else if (!isSendableEmail(email)) {
    errors.email = i18n.t('ppr.withoutLogin.invalidEmail');
  }
  return errors;
};

export default validate;
