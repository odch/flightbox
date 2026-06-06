// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Default to German so tests match German UI text
// (CI browsers have English as default language)
Cypress.on('window:before:load', (win) => {
  win.localStorage.setItem('flightbox_language', 'de');
});

// The Cypress suite runs against a shared, persistent Firebase project, so an
// interrupted run can leave a lock date and/or stray movements behind. A
// leftover lockDate blocks both writing and deleting movements, which wedges
// every subsequent run (PERMISSION_DENIED on movement writes, wrong-key
// associations from stale data). Reset to a clean movement state before each
// spec so the suite is self-healing and no longer needs manual DB cleanup.
before(() => {
  cy.visit('#/');
  cy.loginAdmin();
  cy.resetMovementsTestData();
  cy.logout();
});

// Alternatively you can use CommonJS syntax:
// require('./commands')
