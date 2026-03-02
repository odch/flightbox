# Flightbox

Open digital flight operations system for Swiss aerodromes. Manages aircraft movements (departures/arrivals) at multiple aerodromes. Multi-tenant via per-aerodrome config files in `/projects/`.

Supported aerodromes: lszt (default), lspv, lsze, lszk, lszm, lszo.

## Commands

```bash
# Dev server (default project: lszt)
npm start
npm start --project=lspv

# Build
npm run build --project=lszt
npm run build:prod --project=lszt

# Jest tests
npm test
npm run test:watch
npm run test:coverage

# Firebase Cloud Functions tests
npm run test:functions

# Cypress E2E
npm run cy:open
npm run cy:run
```

The `--project=<name>` flag sets `npm_config_project` which webpack picks up via `process.env.npm_config_project`. Dev server runs on http://0.0.0.0:8080/.

## Architecture

**Stack:** React 17 + Redux + redux-saga + react-final-form + styled-components + Firebase Realtime Database

**Frontend structure:**
- `src/components/` — presentational UI components
- `src/containers/` — Redux-connected containers
- `src/modules/` — Redux ducks (actions, reducer, sagas per feature)
- `src/util/` — utility functions

**Modules:** aerodromes, aircrafts, auth, customs, imports, invoiceRecipients, messages, movements, profile, reports, settings, ui, users

**Backend:** Firebase Realtime Database; Cloud Functions in `/functions/` (Node 20)

**Per-aerodrome config:** `projects/<name>.json` — Firebase credentials, feature flags, theme

## Conventions

- **Components:** PascalCase, each in its own directory with `index.js` barrel export
- **Containers:** `{Name}Container.js`
- **Tests:** `.spec.js`, colocated with source
- **Styled-components transient props:** `$propName` prefix (e.g. `$isActive`)
- **Forms:** react-final-form everywhere (redux-form has been removed)
- **Components style:** functional components + hooks preferred; migrating away from class components
- **Imports:** relative only, no path aliases
- **Formatting:** 2-space indentation, LF line endings

## Git

Do not add `Co-Authored-By` or any AI attribution lines to commit messages.
Subject and body lines max 72 characters.

## Testing

- Jest + React Testing Library
- Custom render helper: `test/renderWithTheme.js` — wraps components with ThemeProvider + BrowserRouter
- Redux saga tests: generator `.next().value` assertions
- Cypress E2E: `cypress/` directory, separate `cypress-testing` project config
