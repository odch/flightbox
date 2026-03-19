import validateUtil from '../../util/validate';
import i18n from '../../i18n';

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
    message: i18n.t('validate.timeDeparture'),
  },
  flightType: {
    types: {
      required: true,
    },
    message: i18n.t('validate.flightType'),
  },
});

const validate = values => {
  const errorArr = validateUtil(values, getConfig());

  const errors = {};

  errorArr.forEach(error => {
    errors[error.key] = error.message;
  });

  return errors;
};

export default validate;
