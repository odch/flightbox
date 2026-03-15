type ValidationMessage = string | Record<string, string>;

interface ValidationRule {
  types?: {
    required?: boolean;
    integer?: boolean;
    match?: RegExp;
    values?: any[];
  };
  message: ValidationMessage;
}

interface ValidationError {
  key: string;
  message: string | undefined;
}

function getMessage(message: ValidationMessage, type?: string): string | undefined {
  if (!type || typeof message === 'string') {
    return message as string;
  }
  return (message as Record<string, string>)[type];
}

function validate(
  data: Record<string, any>,
  config: Record<string, ValidationRule>,
  type?: string
): ValidationError[] {
  const validationErrors: ValidationError[] = [];

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
              if (!validationTypes[typeKey]!.test(dataValue)) {
                valid = false;
              }
              break;
            case 'values':
              if (validationTypes[typeKey]!.indexOf(dataValue) === -1) {
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
          message: getMessage(config[key].message, type),
        });
      }
    }
  }

  return validationErrors;
}

export default validate;
