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

const getSignInEmailContent = ({ signInCode, airportName, themeColor, language }) => {
  const replacements = {
    signInCode,
    airportName,
    themeColor
  };

  const templateName = language === 'en' ? 'signin_en' : 'signin';
  const subject = language === 'en' ? 'Sign in to Flightbox' : 'Bei Flightbox anmelden';

  const htmlTemplate = readTemplate(templateName, 'html');
  const textTemplate = readTemplate(templateName, 'txt');

  return {
    subject,
    html: replacePlaceholders(htmlTemplate, replacements),
    text: replacePlaceholders(textTemplate, replacements)
  };
};

module.exports = {
  getSignInEmailContent
};
