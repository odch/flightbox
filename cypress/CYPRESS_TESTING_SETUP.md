# Cypress Testing Setup

Documents the required persistent data in the `cypress-testing` Firebase project.

## Firebase project

Project: `cypress-testing`
Auth endpoint: `https://europe-west1-cypress-testing.cloudfunctions.net/auth`

## Auth credentials (already in place)

| Username | Password | Role  |
|----------|----------|-------|
| `foo`    | `bar`    | user  |
| `admin`  | `12345`  | admin |

## Email user login (for `loginEmail` command)

The `cy.loginEmail()` command authenticates as `cypress-pilot@example.com` via the
`createTestEmailToken` Cloud Function. Because it mints a custom token for a fixed
user, it is deployed **only** to the `cypress-testing` project, gated twice:

1. **Deploy gate:** `functions/index.js` exports it only when
   `functions/test-config.generated.js` exists and is truthy. That file is
   gitignored and is written by the `deploy:cypress` script, so the function is
   never deployed to any other environment.
2. **Runtime gate:** the function returns 403 unless `TESTING_ENABLED=true` is
   set in its environment. This must be present in `functions/.env.cypress-testing`.

Deploy it with:

```bash
cd functions && npm run deploy:cypress
```

This writes `project-config.generated.json` (see `projects/Configuration.md`)
and `test-config.generated.js`, and runs
`firebase deploy --only functions --project cypress-testing`. Make sure
`functions/.env.cypress-testing` contains `TESTING_ENABLED=true` first, or the
deployed function will return 403.

## Aerodrome settings (already in place)

- Runway `36` with `departureRoute` options including `west`
- Runway `36` with `arrivalRoute` options (required for association E2E tests)
- Flight type `private` enabled
- Aerodrome ICAO and general app settings

## Aircraft settings required for association tests

### Homebase aircraft — `HBKOF`

Used by the existing `create_departure_spec.js` and the new association tests.
Must be present under `/settings/aircrafts/club`:

```json
/settings/aircrafts/club/HBKOF = true
```

This makes `isHomeBase('HBKOF')` return `true` in the Cloud Function.

### External aircraft — `DEXYZ`

Must **not** be present under `/settings/aircrafts/club` or `/settings/aircrafts/homeBase`.
No entry needed anywhere — any immatriculation not in those paths is treated as external.

## Test isolation

The association spec (`associated_movements_spec.js`) writes directly to Firebase
instead of using the UI, to isolate trigger behavior from form validation.

Each test:
- Writes to `/departures` and/or `/arrivals`
- Cleans up in `afterEach`: removes movements from `/departures` and `/arrivals`

`/movementAssociations` has `.write: false` in the security rules, so only the Cloud
Functions (admin SDK) can write there. Movement deletions trigger `onDelete` which cleans
up the corresponding association records automatically.

**Important:** The existing `create_departure_spec.js` asserts exactly 1 departure exists.
The association spec uses `afterEach` cleanup to avoid leaving data that interferes.
If a test run is interrupted, clean up manually:

```bash
# Via Firebase CLI (use --instance for the EU database)
firebase database:remove /departures --project cypress-testing --instance cypress-testing-eu
firebase database:remove /arrivals --project cypress-testing --instance cypress-testing-eu
firebase database:remove /movementAssociations --project cypress-testing --instance cypress-testing-eu
```

## Running E2E tests

```bash
# In terminal 1: start dev server against cypress-testing project
npm start --project=cypress-testing   # or the equivalent cypress-testing config

# In terminal 2: open Cypress
npm run cy:open

# Or headless
npm run cy:run
```

### Movement writes via the API

The movement specs also run with the app built with `movementWritesViaApi`
(see `projects/Configuration.md`), so they cover saving through the app API
as well as direct database writes:

```bash
npm run cy:test:api
```

It builds the app from `projects/cypress-testing-api.json` (which extends
`cypress-testing` and only switches the flag on), exposes
`movementWritesViaApi=true` to the specs (`cypress run --expose`, read
with `Cypress.expose()`; `Cypress.env()` is gone since Cypress 16) and runs `cypress/integration/movements/**` and
`cypress/integration/movements_api/**`. The specs in `movements_api` cover
behaviour that only exists on the API path; the default run skips them. CI
runs both (`.github/workflows/test-pull-request.yml`).

The API run needs the movement routes in the deployed functions:
`npm run deploy:cypress` generates the functions config from
`cypress-testing-api`, so the `cypress-testing` functions have the flag. The
default run is not affected: its app keeps writing to the database directly.

## Cloud Functions deployment

The association E2E tests (Scenarios 3–6) require the **fixed** trigger functions
to be deployed to the `cypress-testing` Firebase project. Deploy with
`npm run deploy:cypress` (see above), not a plain `firebase deploy`: without
the generated config the movement routes the API run needs are missing.

```bash
cd functions && npm run deploy:cypress
```

Scenarios 1–2 (basic bidirectional linking) work with both old and new trigger code.
Scenarios 3 (delete trigger) and 6 (cascade re-evaluation) require the fixed code.
