const fs = require('fs');
var path = require('path');

function loadJsonFile(name) {
  const filePath = path.join(__dirname, name + '.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// A project can extend another one ("extends": "<name>"): its top-level
// properties replace the base's, and each of its environments is merged
// into the base's environment of the same name. Used for build variants of
// one Firebase project (e.g. cypress-testing-api).
function mergeEnvironments(base = {}, own = {}) {
  const merged = Object.assign({}, base);
  Object.keys(own).forEach(name => {
    merged[name] = Object.assign({}, base[name], own[name]);
  });
  return merged;
}

function loadProject(project, chain) {
  const conf = loadJsonFile(project);
  if (!Object.prototype.hasOwnProperty.call(conf, 'extends')) {
    return conf;
  }
  const { extends: baseName, ...own } = conf;
  if (typeof baseName !== 'string' || baseName === '' || baseName === 'default') {
    throw new Error(`Project "${project}": "extends" must name another project`);
  }
  if (chain.includes(baseName)) {
    throw new Error(`Project "${project}": circular "extends" (${chain.concat(baseName).join(' -> ')})`);
  }
  const base = loadProject(baseName, chain.concat(baseName));
  const merged = Object.assign({}, base, own);
  if (base.environments || own.environments) {
    merged.environments = mergeEnvironments(base.environments, own.environments);
  }
  return merged;
}

function load(project) {
  const defaultConf = loadJsonFile('default');
  const projectConf = loadProject(project, [project]);
  return Object.assign({}, defaultConf, projectConf);
}

function packinize(obj) {
  var newObj = {};

  Object.keys(obj).forEach(key => {
    var value = obj[key];

    var newValue;
    if (typeof value === 'string') {
      newValue = JSON.stringify(value);
    } else if (value !== null && typeof value === 'object') {
      newValue = packinize(value)
    } else {
      // Also null: an environment can set it to drop a top-level value
      newValue = value;
    }

    newObj[key] = newValue;
  });

  return newObj;
}

module.exports = {
  load,
  packinize
};
