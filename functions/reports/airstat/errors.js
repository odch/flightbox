'use strict';

// Thrown for request parameters the report does not accept. `field` names
// the parameter.
class AirstatRequestError extends Error {
  constructor(field, message) {
    super(message);
    this.name = 'AirstatRequestError';
    this.code = 'invalid_request';
    this.field = field;
  }
}

// Thrown for a tenant config the report cannot use (see
// tasks/generateServerConfig.js). `field` names the config field.
class AirstatConfigError extends Error {
  constructor(field, message) {
    super(message);
    this.name = 'AirstatConfigError';
    this.code = 'invalid_config';
    this.field = field;
  }
}

// Thrown when stored movements cannot be rendered. All problems of the month
// are collected, so one error lists every movement to fix. A problem carries
// only the offending value, never the whole movement.
class AirstatDataError extends Error {
  constructor(problems) {
    super('Invalid movement data: '
      + problems.map(problem => `${problem.code} (${problem.reference})`).join(', '));
    this.name = 'AirstatDataError';
    this.code = 'invalid_movement_data';
    this.problems = problems;
  }
}

module.exports = {
  AirstatRequestError,
  AirstatConfigError,
  AirstatDataError,
};
