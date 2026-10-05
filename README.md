# open digital Flightbox

[![GitHub release](https://img.shields.io/github/release/odch/flightbox.svg)](https://www.github.com/odch/flightbox/releases/)

### Getting Started

#### Required Node Versions

Node Version for building the app: 22

Node Version for deploying to Firebase and for the cloud functions: 22

#### Start locally

```
$ npm install
$ npm start [--project={PROJECT_NAME}]
```

Then open [http://0.0.0.0:8080/webpack-dev-server/](http://0.0.0.0:8080/webpack-dev-server/) in your browser.

#### Parameters

* `project` (optional): Name of the project. There must a configuration file called `{PROJECT_NAME}.json` be available
                        in the `projects` directory. The default project is `lszt`.

### How to Test

```
$ npm test
```

### How to Deploy

#### Install the required node modules

```
$ npm install
```
#### Build

##### Parameters

* `project` (optional): Name of the project. There must a configuration file called `{PROJECT_NAME}.json` be available
                        in the `projects` directory. The default project is `lszt`.

##### Development or test environment

```
$ npm run build [--project={PROJECT_NAME}]
```

##### Production environment

```
$ npm run build:prod [--project={PROJECT_NAME}]
```

#### Push to Firebase

Node version for this step: 22

Prerequisites: Firebase Tools must be installed (`npm install -g firebase-tools@13`).

**Caution:** Ensure that you have selected the right Firebase project (list all projects by typing `firebase list` and change it if necessary (with `firebase use`)).

##### Set up env

##### Database

###### Flightbox

**Code**:

In project conf JSON file, set the following properties:

- `environments.(test|production).firebaseDatabaseName`
- `environments.(test|production).firebaseDatabaseUrl`

**Functions**:

Set the realtime database name for the cloud functions:

```
firebase functions:config:set rtdb.instance={RTDB NAME}
```

(e.g. `firebase functions:config:set rtdb.instance=lszt-test`)


If the database is not in the default location and the database URL is not `{instance}.firebaseio.com`, you also have
to set the database URL additionally:

```
firebase functions:config:set rtdb.url={RTDB URL}
```

(e.g. `firebase functions:config:set rtdb.url=https://lszt-test-eu.europe-west1.firebasedatabase.app`)

###### Flightbox-Stripe repository

In the https://github.com/odch/flightbox-stripe repository, set the following Github-Workflow environment variables:

- `FIREBASE_RTDB_NAME`
- `FIREBASE_RTDB_URL`

##### Deploy app

Before executing this command, make sure the correct project was built using the Node version
mentioned at the beginning of this document.

```
$ firebase target:apply database main {RTDB NAME}
$ firebase deploy --only hosting,database:main
```

(e.g. `lszt-test` for `{RTDB NAME}`)

##### Deploy cloud functions

Use the following commands to deploy the cloud functions.

Before executing these commands, make sure you selected the correct Node version for the cloud
functions, which is mentioned at the beginning of this document.

```
$ cd functions && npm ci && cd ..
$ node tasks/generateServerConfig.js {PROJECT} {test|production} functions/project-config.generated.json {FIREBASE PROJECT}
$ firebase deploy --only functions
```

(e.g. `lsze`, `test` and `lsze-test`). Without this file, features that need the tenant config (such as the
airstat report API) stay disabled.

## Cloud functions

### `auth`

Can be called to create a custom authentication token. Has to be called via **`POST`**.

The following authentication modes are implemented: `static`, `guest_token` and `kiosk_token`.

#### Mode *static*

Returns a token if the given username and password match one of the configured static credentials. The credentials
are configured via the `AUTH_STATIC_CREDENTIALS` environment variable as a comma-separated list of `username:password`
pairs (e.g. `AUTH_STATIC_CREDENTIALS="foo:bar,admin:12345"`). If no credentials are configured, authentication always
fails.

Request example:

```
$ curl \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"mode": "static", "username": "<USERNAME>", "password": "<PASSWORD>"}' \
    https://europe-west1-<PROJECT_ID>.cloudfunctions.net/auth
```

### API

The paths below are on the app's own domain, e.g. `https://lsze.flightbox.aero/api/v1/aerodrome/status`
(production) or `https://lsze-test.web.app/api/v1/aerodrome/status` (test): Firebase Hosting forwards `/api/**`
to the `api` function, with a timeout of 60 seconds. Give external programs this URL. The function also answers
on `https://europe-west1-<PROJECT_ID>.cloudfunctions.net` with the same paths, which the app itself uses.

The `/v1` paths stay compatible; an incompatible change would get a new version. `/api/aerodrome/status` stays
as an alias of `/api/v1/aerodrome/status` for existing callers. The other paths serve the app itself and change
with it. All routes answer CORS requests from any origin.

| Method | Path | Caller | Returns |
|--------|------|--------|---------|
| `GET` | `/api/v1/aerodrome/status` | anyone | [Aerodrome status](#aerodrome-status) |
| `GET` | `/api/v1/reports/airstat` | API key or admin | [Airstat report](#airstat-report) (CSV) |
| `GET`, `POST` | `/api/v1/api-keys` | admin | List and create [API keys](#api-keys) |
| `DELETE` | `/api/v1/api-keys/<id>` | admin | Revoke an [API key](#api-keys) |
| `GET` | `/api/customs/invoices` | admin | [Customs](#customs) invoices of a month |
| `GET` | `/api/customs/checkouts` | admin | [Customs](#customs) checkouts of a month |
| `POST` | `/api/customs/prepopulated-forms` | user, not guest or kiosk | [Customs](#customs) form for a movement |
| `GET` | `/api/customs/availability` | user | Whether [customs](#customs) is configured |
| `GET` | `/api/users/me/invoice-recipients` | user | [Invoice recipients](#invoice-recipients) of the user |

*Anyone* needs no authentication, *user* the Firebase ID token of a logged-in user, *admin* that of an admin
(see [Authentication](#authentication)). The airstat report and the API keys exist only on projects with
`reportApiEnabled` (see `projects/Configuration.md`).

#### Authentication ####

* **API key** (external programs): `Authorization: Bearer fbx_...`, see [API keys](#api-keys).
* **Firebase ID token** (the app): `Authorization: Bearer <ID token>` of a logged-in user. Without a valid,
  unrevoked token the answer is `401 Unauthorized`. Routes for admins answer `403 Forbidden: Admins only` to
  other users, and the customs form answers `403 Forbidden: not available to shared sessions` to guest and kiosk
  logins. These answers are not JSON: the body is just that text (sent as `text/html`).

#### Aerodrome status ####

Returns the current aerodrome status, without authentication.

`GET /api/v1/aerodrome/status` (also `/api/aerodrome/status`, the path from before `/v1`)

Returns (example):
```
{
  "status": "closed",
  "last_update_by": "Hans Meier",
  "last_update_date": "2020-04-12T22:29:01.565Z",
  "message": "Flugplatz geschlossen. Kinderspielplatz und Restaurant geschlossen.",
  "last_update_user": {
    "uid": "...",
    "firstname": "Hans",
    "lastname": "Meier",
    "email": "hans.meier@example.com"
  }
}
```

`last_update_user` holds those of its fields that are stored with the status and is left out when there are
none. If no status is set, `{}` is returned. The answer is never cached (`Cache-Control: no-cache, no-store,
must-revalidate`).

#### Airstat report ####

Returns the airstat (BAZL) report of one month as CSV, the same file as the export in the admin area. Only
available on projects with `reportApiEnabled` (see `projects/Configuration.md`).

`GET /api/v1/reports/airstat?year=2026&month=9&internal=true&delimiter=semicolon`

* `year`, `month`: required, the Europe/Zurich calendar month.
* `internal`: `true` adds the additional columns ("Zusätzliche Informationen inkludieren"), default `false`.
* `delimiter`: `comma` (default) or `semicolon` (`,` and `;` work too).

Requires an API key with the scope `reports:airstat` (`reports:airstat:internal` too for `internal=true`) or
the Firebase ID token of an admin, both as `Authorization: Bearer <API key or ID token>`. For an ID token
that is not valid the answer is `401`, for a user who is not an admin `403` (text, not JSON). For the API key
errors see [API keys](#api-keys).

The report's own errors are JSON: `400` for invalid parameters, `500` with `error: "invalid_movement_data"` and
the references of the movements to correct when some movements cannot be reported, otherwise `500`.

Example:

```
$ curl -H "Authorization: Bearer fbx_..." \
    "https://lsze-test.web.app/api/v1/reports/airstat?year=2026&month=9"
```

#### API keys ####

External programs authenticate with an API key that an admin creates in the admin area ("API-Zugriff").
The tab and these endpoints exist on projects with `reportApiEnabled` only.

A key looks like `fbx_<id>_<secret>` and is shown once, when it is created. Only a hash of the secret is
stored. Each key has a name, one or more scopes and an expiry (3, 6, 12 or 24 months, or none), and can be
revoked at any time.

Scopes:

* `reports:airstat`: the airstat report.
* `reports:airstat:internal`: the report with `internal=true`, which contains personal data. Needs
  `reports:airstat`.

A key allows 100 requests per UTC day. Errors (JSON, `error` field):

* `400 credentials_in_url`: the key (or a parameter such as `key` or `token`) was sent in the URL. The
  request is rejected, the key stays valid; send it in the `Authorization` header.
* `401 invalid_api_key`: unknown or revoked key; `401 key_expired`: the key has expired.
* `403 insufficient_scope`: the key lacks the scope named in `scope`.
* `429 rate_limited`: the daily limit is used up; `Retry-After` gives the seconds until it resets.

Admin endpoints, with the Firebase ID token of an admin (`Authorization: Bearer <ID token>`):

* `GET /api/v1/api-keys`: `{availableScopes, keys}`, the keys without their secrets, newest first.
* `POST /api/v1/api-keys` with `{"name", "scopes", "expiresInMonths": 3|6|12|24|null,
  "confirmPersonalData"}` (`confirmPersonalData: true` is required for `reports:airstat:internal`):
  `201` with `{key, apiKey}`; `key` is the only copy of the full key. `400 invalid_request` with `field`
  for an invalid body.
* `DELETE /api/v1/api-keys/<id>`: revokes the key, `204`.

#### Customs ####

The integration with the customs declaration app configured in the admin area (`/settings/customsDeclarationApp`).
Errors are JSON with an `error` message.

* `GET /api/customs/invoices?year=2026&month=9` (admin): the customs app's invoices of that month as a JSON
  array, `[]` when no customs app is set up (`/settings/customsDeclarationApp` missing). `500` when the customs
  app fails or its settings are incomplete.
* `GET /api/customs/checkouts?year=2026&month=9` (admin): the checkouts of that month, like the invoices.
* `POST /api/customs/prepopulated-forms` (user, not guest or kiosk) with
  `{"movementType": "departure" | "arrival", "movementKey": "<key>"}`: builds the customs form from the stored
  movement and posts it to the customs app; returns the customs app's answer. `400` for an invalid body, `404`
  for an unknown movement, `503` when no customs app is set up, `500` when it fails or its settings are
  incomplete.
* `GET /api/customs/availability` (user): `{"available": true}` when the customs settings are complete (access
  token, base URL and aerodrome), else `false`.

Cloud Functions push lists maintained in the admin area to the customs app whenever they are written (`PUT`, the
full list each time):

* `/settings/invoiceRecipients` → `/api/invoice-recipients`
* `/settings/customsSelfDeclarationEmails` (tab "Zoll-Selbstdeklaration", shown when the project enables
  `customsSelfDeclarationEnabled` and customs is available) →
  `/api/self-declaration-emails`: the logins whose declarations the customs app forwards without review by
  the aerodrome.
* `/settings/aircrafts` → `/api/homebased-aircraft`

For the first two, the outcome is stored in `/settings/customsSyncStatus/<invoiceRecipients|selfDeclarationEmails>`
(`status` `ok` or `error`, `timestamp`, `rejected` entries, `httpStatus`) and shown on their admin tabs. A failed
push is not retried automatically; the next change of the list pushes the whole list again.

#### Invoice recipients ####

`GET /api/users/me/invoice-recipients` (user): the names of the invoice recipients (`/settings/invoiceRecipients`)
whose e-mail addresses include the user's, as a JSON array, e.g. `["Motorfluggruppe"]`; `[]` for a login without
e-mail address, such as guest and kiosk. `500` with an `error` message when the lookup fails.
