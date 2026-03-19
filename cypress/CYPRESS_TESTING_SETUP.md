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
`createTestEmailToken` Cloud Function. This function is gated behind a config flag
that must be enabled on the `cypress-testing` project:

```bash
firebase functions:config:set testing.enabled=true --project cypress-testing
firebase deploy --only functions --project cypress-testing
```

The function always creates a token for the hardcoded email `cypress-pilot@example.com`
and returns 403 on any project where `testing.enabled` is not set.

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

## Cloud Functions deployment

The association E2E tests (Scenarios 3–6) require the **fixed** trigger functions
to be deployed to the `cypress-testing` Firebase project:

```bash
firebase deploy --only functions --project cypress-testing
```

Scenarios 1–2 (basic bidirectional linking) work with both old and new trigger code.
Scenarios 3 (delete trigger) and 6 (cascade re-evaluation) require the fixed code.
