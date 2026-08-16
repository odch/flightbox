const fs = require('fs');
const path = require('path');

const PLACEHOLDER_REGEX = /\{\{(\w+)\}\}/g;

const replacePlaceholders = (content, replacements) => {
  return content.replace(PLACEHOLDER_REGEX, (match, key) => {
    return replacements[key] !== undefined ? replacements[key] : match;
  });
};

// airportName and themeColor come from the (public) request body and are
// interpolated into the sign-in email HTML, so they must be neutralized before
// insertion to prevent HTML/CSS injection (e.g. attacker-authored markup or
// phishing links in a mail sent from the trusted Flightbox sender).
const escapeHtml = value =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Accept only a hex colour (#rgb / #rrggbb / #rrggbbaa) or a plain CSS colour
// keyword; anything else falls back to a safe default so it cannot break out of
// the style attribute or inject CSS.
const SAFE_COLOR_REGEX = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)$/;
const DEFAULT_THEME_COLOR = '#000000';

const sanitizeThemeColor = color =>
  (typeof color === 'string' && SAFE_COLOR_REGEX.test(color)) ? color : DEFAULT_THEME_COLOR;

const readTemplate = (templateName, format) => {
  const templatePath = path.join(__dirname, 'templates', `${templateName}.${format}`);
  return fs.readFileSync(templatePath, 'utf8');
};

const getSignInEmailContent = ({ signInCode, airportName, themeColor, language }) => {
  const templateName = language === 'en' ? 'signin_en' : 'signin';
  const subject = language === 'en' ? 'Sign in to Flightbox' : 'Bei Flightbox anmelden';

  const htmlTemplate = readTemplate(templateName, 'html');
  const textTemplate = readTemplate(templateName, 'txt');

  const safeColor = sanitizeThemeColor(themeColor);
  const name = airportName === undefined || airportName === null ? '' : airportName;

  // HTML output: escape the free-text name and use the validated colour.
  const htmlReplacements = {
    signInCode,
    airportName: escapeHtml(name),
    themeColor: safeColor
  };
  // Plain-text output: no markup context, so raw text is fine.
  const textReplacements = {
    signInCode,
    airportName: name,
    themeColor: safeColor
  };

  return {
    subject,
    html: replacePlaceholders(htmlTemplate, htmlReplacements),
    text: replacePlaceholders(textTemplate, textReplacements)
  };
};

module.exports = {
  getSignInEmailContent
};
