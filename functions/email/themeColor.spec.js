'use strict'

const { SAFE_COLOR_REGEX, DEFAULT_THEME_COLOR, sanitizeThemeColor } = require('./themeColor')

describe('email/themeColor', () => {
  it('uses black as the default colour', () => {
    expect(DEFAULT_THEME_COLOR).toBe('#000000')
    expect(SAFE_COLOR_REGEX.test(DEFAULT_THEME_COLOR)).toBe(true)
  })

  it.each(['#abc', '#027ABB', '#003863', '#aabbccdd', 'blue', 'RebeccaPurple'])(
    'keeps the valid colour %p', color => {
      expect(sanitizeThemeColor(color)).toBe(color)
    }
  )

  it.each([
    undefined,
    null,
    42,
    '',
    '#12',
    '#123456789',
    '#ggg',
    '027ABB',
    'rgb(0, 0, 0)',
    'light blue',
    ' blue',
    'red; } </style><script>alert(1)</script>',
    'red;background:url(https://evil.example)',
    'blue\n'
  ])('replaces %p with the default colour', color => {
    expect(sanitizeThemeColor(color)).toBe(DEFAULT_THEME_COLOR)
  })
})
