const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://0.0.0.0:8080/',
    specPattern: 'cypress/integration/**/*_spec.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
  },
})
