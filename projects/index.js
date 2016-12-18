const fs = require('fs');
var path = require('path');

function load(project) {
  const filePath = path.join(__dirname, project + '.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
