import { PropTypes, Component } from 'react';
import update from 'react-addons-update';

class WizardStep extends Component {

  constructor(props) {
    super(props);
    this.state = {
      data: this.props.data || {},
      validationErrors: [],
    };
  }

  /**
   * Call this to trigger validation of data of this step.
   *
   * Sets validation errors onto state of this component and returns
   * `true`, if the validation was successful and `false`, if there
   * are validation errors.
   *
   * @public
   * @returns {boolean} true, if validation was successful and false,
   * if there are validation errors.
   */
  validate() {
    const validationErrors = this.getValidationErrors();
    this.setState({
      validationErrors,
    });
    return validationErrors.length === 0;
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      data: nextProps.data,
    }, () => {
      if (this.props.showValidationErrors === true) {
        this.validate();
      }
    });
  }

  getUpdateHandlerDelegate(key) {
    return e => {
      this.updateData(key, e.target.value);
    };
  }

  getKeyUpHandlerDelegate(key) {
    return e => {
      if (typeof this.props.onKeyUp === 'function') {
        this.props.onKeyUp({
          key,
          value: e.target.value,
        });
      }
    };
  }

  updateData(key, value) {
    const data = update(this.state.data, {
      [key]: { $set: value },
    });
    this.setState({
      data,
    }, () => {
      this.props.updateData({
        key,
        value,
      });
    });
  }

  /**
   * Override this in your subclass.
   *
   * Returns an object with keys of the data fields as keys and the validation
   * configuration for the field as value. The value should contain a property
   * `types` which contains the validation strategies and a property `message`
   * containing the message which should be displayed if one of the validation
   * types fails.
   *
   * Supported validation types:
   * - required (true|false)
   * - match (regex)
   * - integer (true|false)
   * - values (array of allowed values)
   *
   * Example:
   *
   * {
   *  immatriculation: {
   *    types: {
   *      required: true,
   *      match: /^[A-Z0-9]+$/,
   *    },
   *    message: 'Insert the immatriculation of the aircraft. ' +
   *             'May contain upper case letters and digits.',
   *  },
   *  flightType: {
   *    types: {
   *      required: true,
   *      values: ['commercial', 'private'],
   *    },
   *    message: 'Choose type of flight.',
   *  }
   *
   * @returns {Object} the validation configuration.
   */
  getValidationConfig() {
    return {};
  }

  getValidationError(key) {
    if (this.props.showValidationErrors === true) {
      const error = this.state.validationErrors.find(validationError => validationError.key === key);
      if (error) {
        return error.message;
      }
    }
    return null;
  }

  getValidationErrors() {
    const validationErrors = [];

    const validationConfig = this.getValidationConfig();
    for (const key in validationConfig) {
      if (validationConfig.hasOwnProperty(key)) {
        let valid = true;

        const dataValue = this.state.data[key];

        const validationTypes = validationConfig[key].types || {};

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
            message: validationConfig[key].message,
          });
        }
      }
    }

    return validationErrors;
  }

  filterOptions(options) {
    return options
      .map(option => {
        if (typeof option.available === 'function') {
          if (option.available(this.state.data) === true) {
            return option;
          }
          return null;
        }
        return option;
      })
      .filter(option => !!option);
  }
}

WizardStep.propTypes = {
  updateData: PropTypes.func,
  onKeyUp: PropTypes.func,
  data: PropTypes.object,
  itemKey: PropTypes.string,
  showValidationErrors: PropTypes.bool,
  update: PropTypes.bool,
  readOnly: PropTypes.bool,
};

export default WizardStep;
