const through = require('gulp-through');
const aircraftCategories = require('../src/util/aircraftCategories');

const processors = {
  "runway": processRunway,
  "departureRoute": processDepartureRoute,
  "arrivalRoute": processArrivalRoute,
  "flightType": processFlightType,
  "aircraftCategory": processAircraftCategory
};

function newValEquals(val) {
  return "newData.val() === '" + val + "'";
}

function processRunway(config) {
  return config.aerodrome.runways.map(runway => newValEquals(runway.name)).join(" || ");
}

function processDepartureRoute(config) {
  return processRoute(config.aerodrome.departureRoutes, config.aerodrome.ICAO);
}

function processArrivalRoute(config) {
  return processRoute(config.aerodrome.arrivalRoutes, config.aerodrome.ICAO);
}

function processRoute(routes, aerodrome) {
  const conditions = routes.map(route => newValEquals(route.name));
  conditions.push(newValEquals("circuits") + " && newData.parent().child('location').val().toUpperCase() === '" + aerodrome + "'");
  return conditions.join(" || ");
}

function processFlightType(config) {
  return config.enabledFlightTypes.map(type => newValEquals(type)).join(" || ");
}

function processAircraftCategory() {
  return aircraftCategories.categories.map(type => newValEquals(type)).join(" || ");
}

function processValidationString(rules, config, key, value) {
  const match = typeof value === 'string' && value.match(/\{([a-zA-Z]+)}/);
  if (match) {
    const processorName = match[1];
    const processor = processors[processorName];
    if (processor) {
      rules[key] = processor(config);
    }
  }
}

function process(rules, config) {
  Object.keys(rules).forEach(function(key) {
    const value = rules[key];

    if (key === '.validate') {
      processValidationString(rules, config, key, value);
    } else if (typeof value === 'object') {
      process(value, config);
    }
  });
}

const stream = through('processFirebaseRules', function(file, config) {
  const obj = JSON.parse(String(file.contents));
  process(obj, config);
  const result = JSON.stringify(obj);
  file.contents = new Buffer(result);
});

module.exports = stream;
