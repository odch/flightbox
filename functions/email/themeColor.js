'use strict'

// Theme colour of the email headers (sign-in, PPR). Accept only a hex colour
// (#rgb / #rrggbb / #rrggbbaa) or a plain CSS colour keyword; anything else
// falls back to a safe default so it cannot break out of the style attribute
// or inject CSS. tasks/generatePprConfig.js checks the configured colour with
// the same pattern at deploy time.
const SAFE_COLOR_REGEX = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)$/
const DEFAULT_THEME_COLOR = '#000000'

const sanitizeThemeColor = color =>
  (typeof color === 'string' && SAFE_COLOR_REGEX.test(color)) ? color : DEFAULT_THEME_COLOR

module.exports = {
  SAFE_COLOR_REGEX,
  DEFAULT_THEME_COLOR,
  sanitizeThemeColor
}
