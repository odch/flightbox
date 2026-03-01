import validateUtil from '../../util/validate';
import i18n from '../../i18n';

const getConfig = () => ({
  name: {
    types: {
      required: true,
    },
    message: i18n.t('message.validate.name'),
  },
  phone: {
    types: {
      required: true,
    },
    message: i18n.t('message.validate.phone'),
  },
  email: {
    types: {
      required: true,
      match: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    },
    message: i18n.t('message.validate.email'),
  },
  message: {
    types: {
      required: true,
    },
    message: i18n.t('message.validate.message'),
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
