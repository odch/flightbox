const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://0.0.0.0:8080/',
    specPattern: 'cypress/integration/**/*_spec.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
  },
  // Cypress 16 types without delay by default. Keep the previous 10ms so
  // inputs with autocomplete lookups behave as before.
  keystrokeDelay: 10,
})
