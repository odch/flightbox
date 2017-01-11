import validateUtil from '../../util/validate';

const config = {
  name: {
    types: {
      required: true,
    },
    message: 'Geben Sie hier Ihren Namen ein.',
  },
  phone: {
    types: {
      required: true,
    },
    message: 'Geben Sie hier Ihre Telefonnummer ein.',
  },
  email: {
    types: {
      required: true,
      match: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    },
    message: 'Geben Sie hier Ihre E-Mail-Adresse ein.',
  },
  message: {
    types: {
      required: true,
    },
    message: 'Geben Sie hier Ihre Nachricht ein.',
  },
};

const validate = values => {
  const errorArr = validateUtil(values, config);

  const errors = {};

  errorArr.forEach(error => {
    errors[error.key] = error.message;
  });

  return errors;
};

export default validate;
