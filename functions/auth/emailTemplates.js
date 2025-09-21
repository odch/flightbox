const fs = require('fs');
const path = require('path');

const PLACEHOLDER_REGEX = /\{\{(\w+)\}\}/g;

const replacePlaceholders = (content, replacements) => {
  return content.replace(PLACEHOLDER_REGEX, (match, key) => {
    return replacements[key] !== undefined ? replacements[key] : match;
  });
};

const readTemplate = (templateName, format) => {
  const templatePath = path.join(__dirname, 'templates', `${templateName}.${format}`);
  return fs.readFileSync(templatePath, 'utf8');
};

const getSignInEmailContent = ({ signInLink, airportName, themeColor }) => {
  const replacements = {
    signInLink,
    airportName,
    themeColor
  };

  const htmlTemplate = readTemplate('signin', 'html');
  const textTemplate = readTemplate('signin', 'txt');

  return {
    subject: 'Bei Flightbox anmelden',
    html: replacePlaceholders(htmlTemplate, replacements),
    text: replacePlaceholders(textTemplate, replacements)
  };
};

module.exports = {
  getSignInEmailContent
};
