const fs = require('fs');
var path = require('path');

function loadJsonFile(name) {
  const filePath = path.join(__dirname, name + '.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function load(project) {
  const defaultConf = loadJsonFile('default');
  const projectConf = loadJsonFile(project);
  return Object.assign({}, defaultConf, projectConf);
}

function packinize(obj) {
  var newObj = {};

  Object.keys(obj).forEach(key => {
    var value = obj[key];

    var newValue;
    if (typeof value === 'string') {
      newValue = JSON.stringify(value);
    } else if (typeof value === 'object') {
      newValue = packinize(value)
    } else {
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
