const through = require('gulp-through');
const aircraftCategoriesData = require('../src/util/aircraftCategoriesData');

const processors = {
  "runway": processRunway,
  "departureRoute": processDepartureRoute,
  "arrivalRoute": processArrivalRoute,
  "flightType": processFlightType,
  "aircraftCategory": processAircraftCategory
};

// Personal-access projects (email/passkey + guest/kiosk login,
// `loginForm === 'email'`) scope movement writes to their owner. Shared-access
// projects (e.g. lspv) keep the permissive lockDate-only rule. The
// `{movementOwnership}` token in the movement `.write` rule is replaced with
// this suffix so the lockDate expression itself stays verbatim in the template.
const IS_ADMIN = "root.child('admins/' + auth.uid).exists()";

const IS_GUEST_OR_KIOSK = "(auth.uid === 'guest' || auth.uid === 'kiosk')";

// A pilot (email/passkey) may only create/edit/delete movements they own
// (createdBy === their email). Guest/kiosk sessions have no email; they may
// create ownerless movements and edit those ownerless movements (e.g. to set a
// payment method right after creating), but never touch an owned movement.
const MOVEMENT_OWNERSHIP = [
  "(!data.exists() && newData.child('createdBy').exists() && newData.child('createdBy').val() === auth.token.email)",
  "(!data.exists() && " + IS_GUEST_OR_KIOSK + " && !newData.child('createdBy').exists())",
  "(data.exists() && newData.exists() && data.child('createdBy').exists() && data.child('createdBy').val() === auth.token.email && newData.child('createdBy').val() === auth.token.email)",
  "(data.exists() && newData.exists() && " + IS_GUEST_OR_KIOSK + " && !data.child('createdBy').exists() && !newData.child('createdBy').exists())",
  "(data.exists() && !newData.exists() && data.child('createdBy').exists() && data.child('createdBy').val() === auth.token.email)"
].join(" || ");

function processMovementOwnership(config) {
  if (config.loginForm !== 'email') {
    return "";
  }
  return " && (" + IS_ADMIN + " || " + MOVEMENT_OWNERSHIP + ")";
}

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
  return aircraftCategoriesData.map(category => newValEquals(category.name)).join(" || ");
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
    } else if (key === '.write' && typeof value === 'string' && value.indexOf('{movementOwnership}') !== -1) {
      rules[key] = value.replace('{movementOwnership}', processMovementOwnership(config));
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

// Build the processed rules object for a given project config, reading the
// template from disk. Exposed so the rules can be unit-tested in-memory for any
// config without running the gulp build.
function buildRules(config) {
  const path = require('path');
  const fs = require('fs');
  const template = fs.readFileSync(
    path.join(__dirname, '..', 'firebase-rules-template.json'),
    'utf8'
  );
  const obj = JSON.parse(template);
  process(obj, config);
  return obj;
}

module.exports = stream;
module.exports.process = process;
module.exports.buildRules = buildRules;
