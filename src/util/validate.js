function validate(data, config) {
  const validationErrors = [];

  for (const key in config) {
    if (config.hasOwnProperty(key)) {
      let valid = true;

      const dataValue = data[key];

      const validationTypes = config[key].types || {};

      for (const typeKey in validationTypes) {
        if (validationTypes.hasOwnProperty(typeKey)) {
          switch (typeKey) {
            case 'required':
              if (validationTypes[typeKey] === true && !dataValue) {
                valid = false;
              }
              break;
            case 'integer':
              if (validationTypes[typeKey] === true && dataValue !== parseInt(dataValue, 10)) {
                valid = false;
              }
              break;
            case 'match':
              if (!validationTypes[typeKey].test(dataValue)) {
                valid = false;
              }
              break;
            case 'values':
              if (validationTypes[typeKey].indexOf(dataValue) === -1) {
                valid = false;
              }
              break;
            default:
              throw new Error('Unknown validation type: ' + typeKey);
          }
        }
      }

      if (valid === false) {
        validationErrors.push({
          key,
          message: config[key].message,
        });
      }
    }
  }

  return validationErrors;
}

export default validate;
