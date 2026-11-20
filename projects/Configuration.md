# Configuration

## Projects

All project configurations are located in the `projects` directory. There is one JSON file for each
project.

A project can extend another one with `"extends": "<project>"`: its top-level properties replace those of the
base project as a whole, and each of its environments is merged into the base project's environment of the same
name. This is meant for build variants of one Firebase project, such as `cypress-testing-api` (the Cypress run
with `movementWritesViaApi`). The deploy workflows read `privacySettings` from the project file directly, so a
deployed tenant should not use `extends`.

## Properties

* `aerodrome`
  * `name`
  * `ICAO`
  * `runways`
  * `departureRoutes`
  * `arrivalRoutes`
  * `landingFees`
  * `goAroundFees`
* `environments`
  * `test`
  * `production`
* `theme`
* `themeColor`
* `title`
* `enabledFlightTypes`
* `reportApiEnabled`
* `movementWritesViaApi`
* `centralLogin`
* `customsSelfDeclarationEnabled`
* `ppr`
* `pprGuestRequests`

### `aerodrome`

#### `name`

Human readable name of the aerodrome.

Example: `"Lommis"`

#### `ICAO`

ICAO code of the aerodrome.

Example: `"LSZT"`

#### `runways`

Array of all runways of the aerodrome. Each runway is described with `name` and `type` (`A` for asphalt,
`G` for grass); the type is reported in the airstat report.

Example: `[ { "name": "06", "type": "G" }, { "name": "24", "type": "G" } ]`

#### `departureRoutes`

Array of all departure routes. Each route is described with `name` and `label`.

Example:

```json
[
  {
    "name": "south",
    "label": "Sektor Süd"
  },
  {
    "name": "matzingen",
    "label": "Matzingen"
  }
]
```

#### `arrivalRoutes`

Array of all arrival routes. Each route is described with `name` and `label`.

Example:

```json
[
  {
    "name": "north",
    "label": "Sektor Nord"
  },
  {
    "name": "south",
    "label": "Sektor Süd"
  }
]
```

#### `landingFees`

Configuration of the landing fees is structured as follows:

1. map of flight types (and `default` as default for all flight types which aren't handled explicitly)
2. `club` | `homeBase` | `default`
3. Array of MTOW ranges with fee consisting of the properties `mtowMin` (optional), `mtowMax` (optional) and `fee`.

Minimal configuration example for fee of `10` for all flight types, aircraft origins and MTOW ranges:

```
"default": {
  "default": [
    {
      "fee": 10
    }
  ] 
}
```

Example configuration for LSZT (Lommis):

Definition for humans:

|                                     |	MTOM 0 - 750 kg | MTOM 751 - 1499 kg | MTOM > 1500 kg |
|-------------------------------------|-----------------|--------------------|----------------|
| Clubflugzeuge Schulung (exkl. MwSt) |       CHF 11.00 |          CHF 15.00 |              - |
| Alle anderen Flugzeuge (inkl. MwSt) |       CHF 16.00 |          CHF 20.00 |      CHF 50.00 |

Configuration:

```json
{
  "instruction": {
    "club": [
      {
        "mtowMin": 0,
        "mtowMax": 750,
        "fee": 11
      },
      {
        "mtowMin": 751,
        "fee": 15
      }
    ],
    "default": [
      {
        "mtowMin": 0,
        "mtowMax": 750,
        "fee": 16
      },
      {
        "mtowMin": 751,
        "mtowMax": 1499,
        "fee": 20
      },
      {
        "mtowMin": 1500,
        "fee": 50
      }
    ]
  },
  "default": {
    "default": [
      {
        "mtowMin": 0,
        "mtowMax": 750,
        "fee": 16
      },
      {
        "mtowMin": 751,
        "mtowMax": 1499,
        "fee": 20
      },
      {
        "mtowMin": 1500,
        "fee": 50
      }
    ]
  }
}
```

#### `goAroundFees`

Same structure for the go arounds as for the landings. If no go around fees are defined, the pilots won't be charged
for go arounds.

### `environments`

Description of the environments. Each environment description consists of the following properties:
* `firebaseProjectId`: The Firebase project. Required: the functions deploy fails without it.
* `firebaseDatabaseUrl`: The URL of the Realtime Database.
* `firebaseApiKey`: The Firebase web API key.
* `appUrl`: The https origin the app is served from, e.g. `https://lspl-test.web.app` (no path, query or fragment).
  The aerodrome's e-mail about an open PPR request links to the request in the admin area, and the pilot's PPR e-mails
  link to the status of the request; without `appUrl` they have no links, and the deploy log warns about it where
  `ppr` is on. Required for `pprGuestRequests` (the deploy fails without it), optional otherwise; a value in another
  form fails the deploy.

#### `test`

Description of the test environment.

#### `production`

Description of the production environment.

A property set in an environment replaces the top-level property of the same name in the app's configuration
and in the functions' generated configs (`reportApiEnabled`, `movementWritesViaApi`, `memberManagement`,
`aerodrome`; for PPR `ppr`, `pprGuestRequests`, the aerodrome's `name`, `themeColor` and `appUrl`), e.g.
`"reportApiEnabled": true` in `test` only. `theme`, the landing and go-around fees and `privacySettings` are
always read from the top level.

`enabledFlightTypes`, `loginForm` and `lockOnDateTime` must be set at the top level: the database rules are
built from the top level only, and the functions apply the same movement rules, so the functions deploy fails
when an environment sets one of them. For the same reason, while `movementWritesViaApi` is on, an
environment-level `aerodrome` may not change the `ICAO`, the runway names or the departure and arrival route
names of the top-level one.

### `theme`

The name of the theme to use (must exist in the `theme` directory in the project root). The default theme is "lszt".

### `themeColor`

The main colour of the theme as a hex colour (`#rgb`, `#rrggbb` or `#rrggbbaa`) or a CSS colour name; keep it the same
as the theme's main colour. The browser's theme colour and the web app manifest use it, and so do the header and the
button of the PPR e-mails. A value in another form fails the deploy.

Example: `"#027ABB"`

### `title`

The title of the browser window.

Example: `"MFGT Bewegungen"`

### `enabledFlightTypes`

A list of the enabled flight types.

Available flight types: `private`, `commercial`, `instruction`, `aerotow`, `paradrop`, `glider_private_aerotow`,
`glider_private_winch`, `glider_private_self`, `glider_instruction_aerotow`, `glider_instruction_winch`,
`glider_instruction_self`, `military`, `sar`.

Enabled by default (`projects/default.json`): `private`, `instruction`.

Example: `["private", "commercial"]`

### `reportApiEnabled`

Enables the airstat report API (`GET /api/v1/reports/airstat`) in the Cloud Functions, the API key
endpoints and the "API-Zugriff" tab in the admin area, where admins create the keys for external programs.
Disabled by default.

The functions get this flag and the aerodrome data they need from `functions/project-config.generated.json`, which
the deploy writes with `node tasks/generateServerConfig.js <project> <test|production> <file> [<Firebase project>]`
(with the Firebase project given, a config for another project fails instead of being ignored at runtime).
The generated config holds only whitelisted fields: the feature flags, `memberManagement`, `loginForm`,
`lockOnDateTime`, `enabledFlightTypes`, the aircraft category names, `centralLogin` (if set) and, of the
`aerodrome`, the `ICAO`, the runways (name and type) and the names of the departure and arrival routes.

Example: `true`

### `movementWritesViaApi`

Moves the app's movement writes (creating and editing departures and arrivals, setting the payment method of an
arrival) from direct Realtime Database writes to the API of the Cloud Functions. The functions check each write
with the same rules as the database (required fields, formats, runways, routes, flight types, ownership,
movement lock) and derive `negativeTimestamp`, `createdBy` and `createdBy_orderKey` themselves. They write as
the signed-in user, so the database rules still apply to every write. Deleting movements and reading them still
go to the database directly. Disabled by default; without it the app writes to the database as before.

Both the app and the functions read it: the app from its configuration, the functions, like `reportApiEnabled`,
from `functions/project-config.generated.json`. Set it in an environment to try it on test first
(`"movementWritesViaApi": true` in `environments.test`). Enabled on `lsze` test.

In the app (`src/modules/movements/remoteApi.ts`), the writes go to
`https://europe-west1-<firebaseProjectId>.cloudfunctions.net/api/app/movements/...` with the user's ID token,
like the app's other API calls, so they work the same from `npm start` (the webpack dev server has no proxy for
`/api`) and from Firebase Hosting; with `npm start --project=lsze` they go to the functions of `lsze-test`. The
customs form link of a movement is saved the same way. A rejected write shows the usual "Speichern
fehlgeschlagen" dialog with the API's message (e.g. `Movement is locked`, or `Validation failed: runway`).
Differences to direct database writes:

* Offline or on a network error, saving fails right away; a database write waited and was sent once the
  connection was back. Nothing is retried automatically.
* A new movement is created with `POST`, which is not idempotent: if the connection drops after the request
  reached the functions, the movement may be saved although the app reports a network error. The message says
  so ("check the list before saving again"); saving again creates a second movement. While a save is running,
  further clicks on "Speichern" are ignored.
* Every save is an HTTP request to the `api` function: slower, and a cold start can take a few seconds. No
  progress is shown meanwhile.
* The payment method of an arrival is saved in the background: if that fails, it is only logged in the
  browser console, the user is not told, and the arrival stays without payment method (for `checkout` it is
  then not marked as paid). Before redirecting to the checkout page, the app waits until the write has
  finished, so that leaving the page does not cancel it.
* Updating a movement that does not exist (any more) fails with `404`; the database created it if the rules
  allowed the write.
* The server sets `negativeTimestamp`, `createdBy` and `createdBy_orderKey`; the values of the app are ignored.

Switching it on or off: the routes only exist in functions deployed with the flag (`functions/api/index.js`),
while the app has the flag built in, also in tabs and kiosks that stay open after a deployment. An app with the
flag and functions without it means every save fails with `Request failed (HTTP 404)` (also if the functions
reject the generated configuration, e.g. a `firebaseProjectId` mismatch). The test deployment
(`.github/workflows/firebase-hosting-dev.yml`) deploys hosting and functions in parallel jobs, so:

* On: deploy the functions with the flag first, the way the `build_and_deploy_functions` job does it
  (generated configuration and `.env` file, then `firebase deploy --only functions`), then push the change.
  Otherwise saves fail until the functions job has finished.
* Off: first deploy the app without the flag (build and `firebase deploy --only hosting`) while the functions
  keep it, wait until open tabs and kiosks have been reloaded, then push the change that removes the flag.

The database triggers (fees, payment status, associated movements, lock date) run as before.

Example: `true`

### `centralLogin`

Lets the app API (the routes of `movementWritesViaApi`) also accept access tokens of the central login (the Open
Digital account, `odch/odch-login`), next to the Firebase ID tokens of the app. The Open Digital MCP hub
(`odch/mcp-hub`) uses them to record departures and arrivals for a pilot from an AI client (Claude etc.): it
exchanges the pilot's token at the login (token exchange, RFC 8693) for a token for exactly this instance and
calls `POST/PATCH /api/app/movements/...` with it.

```json
"centralLogin": {
  "issuer": "https://<login origin>",
  "jwksUri": "https://<login origin>/jwks",
  "audience": "flightbox-lsze-test"
}
```

* `issuer`: origin of the login, without a trailing slash; only tokens whose `iss` is exactly this are checked
  as login tokens, all others go through Firebase as before.
* `jwksUri`: the login's signing keys (cached for 10 minutes, refetched when a token names an unknown key).
* `audience`: the name of this instance at the login; a token for another instance is rejected.

Accepted are JWTs (`typ` `at+jwt`) signed with ES256 that carry a verified e-mail address (`email`,
`email_verified`) and the scope `movements:write`. The caller is the pilot with that address: the movement
domain and the database rules (`auth.token.email`, through `auth_variable_override`) check ownership exactly as
for a pilot signed in to the app with the same address, so the pilot sees and edits the same movements either
way. The uid is `login:<account id>`; such callers are never admins, guests or kiosks.

Set it per environment, in `environments.test` only for now. Only the functions read it
(`functions/project-config.generated.json`, validated by `tasks/generateServerConfig.js`); without it, tokens
of the login are rejected like any other unknown token. Not set yet: the login runs at a `*.run.app` address
until `login.opendigital.ch` exists.

### `customsSelfDeclarationEnabled`

Enables the "Zoll-Selbstdeklaration" tab in the admin area, where admins list the logins (e-mail addresses) whose
declarations the customs declaration app forwards to the authorities without review by the aerodrome (only for
aeroplanes below 2250 kg MTOW; heavier aircraft and helicopters are always reviewed). The tab is only shown when
the customs integration is configured (`/settings/customsDeclarationApp`). Disabled by default.

Example: `true`

### `ppr`

Enables PPR (prior permission required) requests: pilots ask for permission to fly in and see the status of
their requests in the app, the aerodrome gets an e-mail for each new request, admins approve or reject requests
in the "PPR-Anfragen" tab, and pilots get an e-mail with the decision. Disabled by default.

The pilot gets a receipt for a request that waits for an answer, and the answer by e-mail (a request answered on
submission gets the answer only). Each of these e-mails links to the status of the request
(`<appUrl>/#/ppr/status/<key>/<token>`), which needs no login and shows no personal data, only the flight, the
status and the aerodrome's answer; there a pending request can be withdrawn (it is deleted, as when the pilot
deletes it in the app, and the aerodrome gets no e-mail). Every e-mail has a token of its own; the request stores
only their SHA-256 hashes, so they go with it when it is deleted.

In the Cloud Functions the flag decides at deploy time whether the PPR endpoints (`/api/ppr/...`) and the daily
cleanup job (`scheduledPprCleanup`) exist: the deploy workflows write it with
`node tasks/generatePprConfig.js <project> <test|production> <file> <Firebase project>`, together with the Firebase
project it is for and, for the e-mails, the aerodrome's name, the theme colour and `appUrl`, to
`functions/ppr-config.generated.js`, and the functions ignore it in any other project. Without that file (locally,
in unit tests) PPR is off in the functions; for local work on PPR, create it for the project you run the emulator with:
`echo "module.exports = { enabled: true, firebaseProjectId: '<project>' };" > functions/ppr-config.generated.js`.

The PPR e-mails have the header of the sign-in e-mail: the aerodrome's name on the theme colour. The subjects of the
pilot's e-mails end with the aerodrome's name. When `appUrl` is set, the aerodrome's e-mail about an open request
links to it in the admin area (`<appUrl>/#/admin?tab=ppr&request=<key>`). The link only opens the request: admins
answer it after their normal login. The admin area keeps the open tab in the URL, so tabs can be linked and survive a
reload.

Admins set the address new requests are sent to in the "PPR-Anfragen" tab (stored at `/settings/ppr/adminEmail`);
while none is set, requests are accepted but not sent to anyone, and the tab shows a warning when requests are
answered manually.

In the same tab admins choose how requests are answered (`/settings/ppr/answerMode`): manually by an admin (the
default) or automatically, i.e. approved right away with the information for pilots set there
(`/settings/ppr/pilotInfo`, e.g. runway, circuit, landing fee, phone number). With automatic answers, "Immer von der
Flugplatzleitung beantworten" (`/settings/ppr/manualAnswers`, `{ helicopters, mtowFrom }`) leaves the requests for
helicopters and for aircraft from an MTOW (kg, the limit included) to an admin, e.g. all helicopters and other aircraft
from 2250 kg. The category and the MTOW the pilot declares in the request decide; like the aircraft type, they are
required, as when recording a movement. The aerodrome's e-mail and the request list say why such a request waits. Either way, new requests for a blocked
day ("Gesperrte Tage" in the tab, stored at `/settings/ppr/closures`: days without PPR visitors, e.g. events, camps,
runway works or nobody on site, often while the aerodrome is open, so blocking days does not change the aerodrome
status) are rejected with its reason, and requests for today are rejected while the aerodrome status is "closed"; the
"Flugplatz-Status" tab says so. Blocking a day leaves the requests made before as they are. The request form shows
the blocked days that have not ended (from the public route `GET /ppr/closures`): red in the calendar, with the reason
on hover and listed below the month, and it refuses them with the reason instead of sending a request that would be
rejected. Admins can revoke an approval with a reason; the pilot gets it by e-mail. The tab shows the settings in short (answer mode, the next
blocked days, the address) until an admin clicks "Bearbeiten".
In the privacy tab ("Datenschutz"), which is shown when `privacySettings` or `ppr` is on, admins set how many days
after the planned date requests are deleted (a whole number from 1 to 3650, stored at `/settings/ppr/retentionDays`).
As for movements and messages, nothing is deleted while no value is set.

Example: `true`

### `pprGuestRequests`

Lets guest sessions and logins without an e-mail address (username/password) send PPR requests without login. It
only counts where `ppr` is on. Disabled by default.

Pilots follow a link on the aerodrome's website (see below) to the login page of the PPR request, which names the
aerodrome and offers the e-mail code login and passkeys as usual (the profile fills in the form, and the requests
are listed under «Meine PPR-Anfragen»). The link with the guest access token also offers «Als Gast fortfahren»: it
starts a guest session, the same as the guest access link for recording movements, and the pilot enters the
details and an e-mail address, which nobody confirms, and follows the request with the link in its e-mails (see
`ppr`). Requests without login are answered automatically as configured, are marked in the "PPR-Anfragen" tab and in
the aerodrome's e-mail ("Ohne Anmeldung gestellt – E-Mail-Adresse nicht bestätigt"), and belong to no login: they
never appear under «Meine PPR-Anfragen», also not after a later login with that address. Kiosk sessions never get PPR.
Without the flag, guest sessions and logins without an e-mail address get no PPR request.

The e-mail code login and the guest session are offered where `loginForm` is `email`. On username/password projects
the login page offers that login: its logins have no e-mail address and request without login where the flag is on,
and pilots without such a login cannot request PPR there.

A client (IP address; IPv6 by its /64 network) can send 10 requests without login per hour, and at most 5 per hour
and 10 per day go to the same mailbox (`+tags` and the dots of Gmail addresses count as one mailbox). The limits are
counted in the database under hashes of the addresses (`/pprGuestRateLimits`), and the daily cleanup prunes them.

Before turning it on:

* Set `appUrl` in the same environment: the receipt links to the status of the request, so the deploy fails without
  it.
* Set the SMTP settings (`/settings/emailSmtp`), as for the e-mail code login.
* Set the link to the privacy policy in the privacy tab (shown with `privacySettings`): the login page links it, also
  for the guest session.
* Set up the guest access (the guest access token) for the link with «Als Gast fortfahren». Renewing the token ends
  all guest sessions; links with the old token still show «Als Gast fortfahren», which then fails, so update the
  published links and QR codes right away.

In the Cloud Functions the flag decides at deploy time whether the endpoint for requests without login
(`POST /ppr/guest-requests`) exists; it takes the ID token of a guest session or a login without an e-mail address,
so renewing the guest access token stops it for guests. The status endpoints exist wherever `ppr` is on and need no
login, since every pilot's e-mails link to the status page. The deploy writes the flag as `guestRequests` to
`functions/ppr-config.generated.js` (see `ppr`); a value other than `true`, `false` or `null` fails the deploy. These
endpoints are served only on the function's own URL, not through Firebase Hosting (`/api/ppr`); they accept JSON
only, and browsers let only the app's pages call them (CORS): `appUrl`, `https://<Firebase project>.web.app`,
`https://<Firebase project>.firebaseapp.com` and the dev server (`http://localhost:<port>`,
`http://127.0.0.1:<port>`, `http://0.0.0.0:<port>`). For local work, write the flag into the generated file too:
`echo "module.exports = { enabled: true, guestRequests: true, firebaseProjectId: '<project>' };" > functions/ppr-config.generated.js`.

#### Links for the aerodrome's website

The «PPR-Link» button of the PPR settings in the "PPR-Anfragen" tab shows the links with a copy button and a QR code
each; the aerodrome chooses where to use which:

* With the login: `<appUrl>/ppr`, e.g. `https://lspl-test.web.app/ppr`; the app turns it into `<appUrl>/#/ppr/new`,
  which can be linked as well. On the dev server, `http://0.0.0.0:8080/ppr` works the same way.
* With the guest access too, where the guest access token is set, `pprGuestRequests` is on and `loginForm` is
  `email`: `<appUrl>/#/ppr/new?t=<guest access token>`. The token is in the fragment, like in the guest access link,
  so browsers send it to no server, and the app removes it from the address once the guest session has started.
  Whoever has this link can also record movements as guest, as with the guest access link.

An admin who opens a link is logged in and gets the form of logged-in pilots; a private window shows what visitors
see. Use a plain link or button, e.g. "PPR-Anfrage stellen": the app cannot be shown in an iframe on another site
(`X-Frame-Options: DENY` and `frame-ancestors 'none'` in `firebase.json`).

Example: `true` in `environments.test`, next to `ppr` and `appUrl`

## Full example


```json
{
  "aerodrome": {
    "name": "Lommis",
    "ICAO": "LSZT",
    "runways": [
      {
        "name": "06",
        "type": "G"
      },
      {
        "name": "24",
        "type": "G"
      }
    ],
    "departureRoutes": [
      {
        "name": "south",
        "label": "Sektor Süd"
      },
      {
        "name": "matzingen",
        "label": "Matzingen"
      }
    ],
    "arrivalRoutes": [
      {
        "name": "north",
        "label": "Sektor Nord"
      },
      {
        "name": "south",
        "label": "Sektor Süd"
      }
    ]
  },
  "environments": {
    "test": {
      "firebaseProjectId": "lszt-test",
      "firebaseDatabaseUrl": "https://lszt-test-default-rtdb.europe-west1.firebasedatabase.app",
      "firebaseApiKey": "<API key>"
    },
    "production": {
      "firebaseProjectId": "lszt-prod",
      "firebaseDatabaseUrl": "https://lszt-prod-default-rtdb.europe-west1.firebasedatabase.app",
      "firebaseApiKey": "<API key>"
    }
  },
  "theme": "lszt",
  "title": "MFGT Bewegungen",
  "enabledFlightTypes": [
      "private",
      "commercial",
      "instruction",
      "aerotow",
      "paradrop"
    ]
}
```
