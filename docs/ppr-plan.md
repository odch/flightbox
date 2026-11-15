# PPR (Prior Permission Required) Feature Plan

## Context

Aerodromes lszm, lsze, lspv (and soon lspl) are PPR — pilots must get permission before flying in. Currently they just publish a phone number. This feature digitizes that: pilots submit PPR requests, admins approve/reject, pilots get notified via email.

Often nobody answers that phone and a recorded message gives the information for pilots. For such aerodromes, requests can also be answered automatically: approved right away with that information, and rejected on blocked days (events, runway works, nobody on site) and for today while the aerodrome status is closed (see Phase 10).

**Key constraints:**
- Firebase will eventually be replaced (likely Postgres). Hexagonal architecture — Firebase is a swappable repository adapter.
- All reads and writes go through backend Cloud Functions (HTTP endpoints). The frontend never talks to Firebase directly for PPR. No new Firebase database rules.
- Login required via existing email OTP flow unless `pprGuestRequests` is on (Phase 11) — verifies the pilot's email, gives status tracking, no new auth needed. Sessions without an email address are rejected by the routes with login: shared guest and kiosk sessions (`fbAuthExcludingShared`) and username/password logins (`requireEmail`). Where `pprGuestRequests` is on, visitors without login, guest sessions and username/password logins send requests without login (the address is not confirmed); kiosk sessions never get PPR. lspv uses username/password login, so it needs email login or `pprGuestRequests` before PPR can be used there.
- Frontend stays in current React+Redux stack.

---

## Architecture

```
Frontend (React+Redux)
       │
       │  HTTP calls (fetch) to existing `api` Cloud Function
       ▼
Express app (functions/api/index.js)   ← add PPR routes here
       │
       ▼
   Use Cases                            ← pure business logic
       │
       ▼
   Ports (interfaces)
       │
       ├──▶ Firebase Adapter            ← swap for Postgres later
       └──▶ Email Notifier              ← swap for push/SMS later
```

**Key:** There's already an Express-based `api` Cloud Function (`functions/api/index.js`) with auth middleware (`fbAuth`, `fbAuthExcludingShared`, `fbAdminAuth`). PPR routes are added to this existing app — no new Cloud Functions, no extra cold starts.

### Backend structure — `functions/ppr/`

```
functions/ppr/
  domain/
    pprRequest.js          # entity factory + validation + status constants
    pprSettings.js         # validation of the admin settings
    pprAnswer.js           # the answer on submission: closures, automatic answers
    pprStatusLink.js       # status tokens of a request (hashes only), the public status view
  usecases/
    submitRequest.js       # create request, answer it if decided, notify
    reviewRequest.js       # approve/reject, notify pilot
    revokeApproval.js      # revoke an approval, notify pilot
    listRequests.js        # query: all (admin) or by user
    getRequestStatus.js    # the status for the holder of a status link
    withdrawRequest.js     # withdraw a pending request with its status link
  ports/
    pprRepository.js       # repository interface (JSDoc)
    notifier.js            # notification interface (JSDoc)
    aerodromeStatus.js     # current aerodrome status (JSDoc)
    statusTokens.js        # tokens of the status links (JSDoc)
  adapters/
    firebasePprRepository.js   # Firebase RTDB implementation
    firebaseAerodromeStatus.js # latest entry of /status
    firebaseRateLimiter.js     # limits per login, and without login per client and mailbox
    cryptoStatusTokens.js      # random status tokens and their SHA-256 hashes
    emailNotifier.js           # nodemailer/SMTP implementation
    emailTemplates.js          # email HTML templates
    adminLinks.js              # links from the emails into the app: admin area, status page (a contract with the app)
  clientIp.js              # the client's address for the limits without login
  deployConfig.js          # the deploy's config (functions/ppr-config.generated.js), for this project only
  deps.js                  # the adapters the use cases run with
  httpsOrigin.js           # checks the app's https origin (appUrl)
  routes.js                # Express router mounted in api/index.js
  publicRoutes.js          # Express router of the routes without login, mounted at /ppr only
```

`tasks/generatePprConfig.js` writes the deploy's config; `functions/email/themeColor.js` checks the theme colour for
the sign-in and the PPR emails.

### Frontend `remote.ts` — HTTP client via existing API base

```ts
// src/modules/ppr/remote.ts — calls the existing api Cloud Function
const BASE = `https://europe-west1-${__FIREBASE_PROJECT_ID__}.cloudfunctions.net/api`

export const submitRequest = (data, token) => fetch(`${BASE}/ppr/requests`, { method: 'POST', ... })
export const listRequests = (token) => fetch(`${BASE}/ppr/requests`, { headers: { Authorization: `Bearer ${token}` } })
export const reviewRequest = (key, review, token) => fetch(`${BASE}/ppr/requests/${key}/review`, { method: 'POST', ... })
```

---

## Progress Tracker

### Phase 1: Config
- [x] Add `"ppr": false` to `projects/default.json`
- [x] Deploy the PPR endpoints and cleanup job only where `ppr` is true (`functions/ppr-config.generated.js`, written by `tasks/generatePprConfig.js` in the deploy workflows, with the aerodrome's name and theme colour for the emails)
- [x] Add `"pprGuestRequests": false` to `projects/default.json` (requests without login, Phase 11)
- [ ] Set `"ppr": true` in `projects/<name>.json` for each PPR aerodrome
- [x] Admins set the notification address (`/settings/ppr/adminEmail`) in the PPR admin tab
- [ ] Set the notification address at each PPR aerodrome

### Phase 2: Hexagonal Backend (`functions/ppr/`)

#### 2a. Domain
- [x] Create `functions/ppr/domain/pprRequest.js` — entity factory + validation
  - Required fields: firstname, lastname, email, immatriculation, plannedDate, plannedTime, flightType
  - Phone is optional
  - Language (`de`/`en`, default `de`): the app language at submission, used for the pilot's emails
  - Text is stored as entered (every output escapes it), trimmed, with max lengths (name: 100, immatriculation: 10, remarks: 500); non-text values are rejected
  - Validate formats: email, date (YYYY-MM-DD), time (HH:MM)
  - plannedDate must be a real calendar date from today (Zurich time) up to 365 days ahead
  - Validation errors carry `code: 'INVALID_INPUT'` (400); routes map error codes, not messages
  - Status constants: PENDING, APPROVED, REJECTED, REVOKED (an approval taken back)
- [x] Write tests: `functions/ppr/domain/pprRequest.spec.js`

#### 2b. Ports
- [x] Create `functions/ppr/ports/pprRepository.js` — JSDoc interface
  - `save(pprRequest) → { key }`
  - `findByKey(key) → pprRequest | null`
  - `updateIf(key, predicate, data) → { applied, request }` — atomic (RTDB transaction); `data` may be a function of the request, e.g. to add a status token
  - `findAll() → pprRequest[]`
  - `findByEmail(email) → pprRequest[]`
  - `removeIf(key, predicate) → { applied, request }` — atomic (RTDB transaction)
- [x] Create `functions/ppr/ports/notifier.js` — JSDoc interface
  - `notifyRequestSubmitted(pprRequest, adminEmail)`
  - `notifyRequestReceived(pprRequest, statusToken)` — the receipt of a pending request
  - `notifyRequestReviewed(pprRequest, statusToken)` — approved, rejected or revoked
- [x] Create `functions/ppr/ports/statusTokens.js` — JSDoc interface
  - `create() → { token, hash }`
  - `matches(token, hashes) → boolean`
- [x] Create `functions/ppr/ports/aerodromeStatus.js` — JSDoc interface
  - `getCurrent() → { status, details } | null`

#### 2c. Use cases
- [x] Create `functions/ppr/usecases/submitRequest.js`
  - Receives `{ repository, notifier, settings, aerodromeStatus }`, input
  - Creates entity, decides the answer (Phase 10), saves it with the answer, notifies admin and, when answered, the pilot
  - Returns `{ key, status, reviewRemarks? }`, so the form shows the answer
- [x] Create `functions/ppr/usecases/reviewRequest.js`
  - Receives `{ repository, notifier }`, key, review
  - Validates the target status (approved/rejected)
  - Sanitizes admin reviewRemarks
  - Updates status only while pending (atomic `updateIf`), then notifies pilot
- [x] Create `functions/ppr/usecases/listRequests.js`
  - Admin: findAll(), Pilot: findByEmail()
- [x] Create `functions/ppr/usecases/deleteRequest.js`
  - Only the creator, only while pending (atomic `removeIf`); decided requests stay as the aerodrome's record
- [x] Write tests: `functions/ppr/usecases/submitRequest.spec.js`
- [x] Write tests: `functions/ppr/usecases/reviewRequest.spec.js`

#### 2d. Firebase adapter
- [x] Create `functions/ppr/adapters/firebasePprRepository.js`
  - Implements pprRepository using `admin.database().ref('/pprRequests')`
- [x] Write tests: `functions/ppr/adapters/firebasePprRepository.spec.js`

#### 2e. Email notifier
- [x] Extract shared SMTP utils from `functions/auth/sendSignInEmail.js` into `functions/email/smtp.js`
- [x] Create `functions/ppr/adapters/emailTemplates.js`
  - Request submitted → admin: pilot name, aircraft, date/time, flight type (German label, ported from `de.json` with a parity test)
  - Request approved → pilot: confirmation, with the admin's remarks when given
  - Request rejected → pilot: with admin remarks
  - Pilot emails in the pilot's language (`*_en` templates for English, as for sign-in); the admin email stays German
  - HTML-escape all user-supplied values; include text/plain alternative
- [x] Create `functions/ppr/adapters/emailNotifier.js`
- [x] The emails have the sign-in email's header ("Flightbox" and the aerodrome's name on the theme colour, from the deploy's config) with the status as the first heading; the text emails start with "Flightbox – <name>"; the pilot's subjects end with the aerodrome's name
- [x] The aerodrome's email links an open request to the admin area when `appUrl` is set (`<appUrl>/#/admin?tab=ppr&request=<key>`); no one-click approve/reject links (mail scanners open links, and the notification address may be a shared mailbox); the pilot's fields of a single line (name, phone, registration, aircraft type, flight type) are stored on one line, so they cannot imitate the link in the text email

#### 2f. Express router
- [x] Create `functions/ppr/routes.js`
  - `POST /requests` — pilot submits (fbAuthExcludingShared, requireEmail; at most 10 accepted submissions per user and hour, counted in `/pprRateLimits`)
  - `GET /requests` — the caller's own requests, admins included (fbAuthExcludingShared, requireEmail)
  - `GET /requests/all` — all requests for the admin list (fbAdminAuth)
  - `GET /settings`, `PATCH /settings` — the notification address (PPR tab) and the retention (privacy tab), for admins (fbAdminAuth)
  - `POST /requests/:key/review` — admin approves/rejects (fbAdminAuth)
  - `POST /requests/:key/revoke` — admin revokes an approval, with a reason (fbAdminAuth; 409 unless approved)
  - `DELETE /requests/:key` — pilot deletes own (fbAuthExcludingShared, server-side ownership check)
  - Rate limiting: 10 requests/hour/user on submit
  - Validate `:key` format before querying
  - Generic error messages, proper HTTP status codes
- [x] Create `functions/ppr/publicRoutes.js` — the routes without login (Phase 11)
  - `POST /guest-requests` — a request without login (only with `pprGuestRequests`)
  - `POST /status/:key`, `POST /status/:key/withdraw` — the status page of the pilot's links (wherever `ppr` is on), the token in the JSON body

#### 2g. Mount in API
- [x] Add `api.use('(/api)?/ppr', pprRoutes)` to `functions/api/index.js`
- [x] Mount `publicRoutes` at `/ppr` only (the function's own URL), ahead of the permissive CORS

#### Security tests (backend)
- [x] HTML tags stripped from all string fields (pprRequest.spec.js)
- [x] Oversized inputs rejected (pprRequest.spec.js)
- [x] Past dates rejected for plannedDate (pprRequest.spec.js)
- [x] Non-admin cannot call review endpoint - 403 (routes.spec.js)
- [x] Pilot cannot delete another pilot's request - 403 (deleteRequest.spec.js, routes.spec.js)
- [x] Invalid status transitions rejected (pprRequest.spec.js, reviewRequest.spec.js)
- [x] Unauthenticated requests return 401 (routes.spec.js)
- [x] Guest and kiosk sessions return 403 (routes.spec.js)
- [x] Logins without an email (username/password) return 403 on the pilot routes (routes.spec.js)
- [x] Email templates HTML-escape user input (emailTemplates.spec.js)
- [x] Requests without login never take the owner, status or mark from the body, and take a strict, lower-cased address (pprRequest.spec.js, publicRoutes.spec.js)
- [x] Status tokens: only hashes stored, compared in constant time; a missing request, a wrong token and malformed ones are the same 404 (cryptoStatusTokens.spec.js, getRequestStatus.spec.js, publicRoutes.spec.js)
- [x] The lists never return the hashes of the status tokens (listRequests.spec.js)
- [x] The routes without login give other origins no CORS permission, also in preflights, and take JSON only (publicRoutes.spec.js, api/index.spec.js)
- [x] Limits without login per client and mailbox; entries the client sends in `X-Forwarded-For` are ignored (publicRoutes.spec.js, clientIp.spec.js)
- [x] Pilot input cannot imitate the status link line of the text emails (emailTemplates.spec.js)

### Phase 3: Internationalization
- [x] Add `ppr.*` keys to `src/locales/de.json`
- [x] Add `ppr.*` keys to `src/locales/en.json`
- [x] Add `admin.ppr`, `nav.ppr` keys

### Phase 4: Redux Module (`src/modules/ppr/`)
- [x] Create `src/modules/ppr/actions.ts` — LOAD, SUBMIT, UPDATE_STATUS, DELETE, SELECT
- [x] Create `src/modules/ppr/reducer.ts` — `{ data, loading, selected, form: { submitted, commitFailed, reviewFailed, deleteFailed } }`
- [x] Create `src/modules/ppr/remote.ts` — HTTP calls to API (fetch with auth token)
- [x] Create `src/modules/ppr/sagas.ts` — load, submit, review, delete
- [x] Create `src/modules/ppr/index.ts` — barrel export
- [x] Register in `src/modules/index.ts` — combineReducers + fork sagas
- [x] Write tests: `src/modules/ppr/reducer.spec.ts`
- [x] Write tests: `src/modules/ppr/sagas.spec.ts`

### Phase 5: Pilot UI
- [x] Create `src/components/PprRequestForm/` — single-page react-final-form
  - Aircraft: immatriculation, type, mtow (reuse wizard field components)
  - Pilot: name, email, phone (optional) — pre-populated from profile
  - Flight: plannedDate, plannedTime, flightType, remarks
  - Submit button
- [x] Create `src/components/PprStatusList/` — pilot's own requests with status badges
- [x] Create `src/containers/PprRequestPageContainer.tsx`
- [x] Create `src/containers/PprStatusListContainer.tsx`
- [x] Add PPR entry to `src/components/StartPage/EntryPoints.tsx` (when `__CONF__.ppr && !guest && !kiosk`; with `pprGuestRequests` also «PPR-Anfrage» for guest sessions and logins without an email)
- [x] Add routes to `src/components/App/App.tsx`: `/ppr/new`, `/ppr` (guarded by `__CONF__.ppr`)
- [x] Write tests: `PprRequestForm/validate.spec.ts`
- [x] Write tests: `PprStatusList/PprStatusList.spec.tsx`

### Phase 6: Admin UI
- [x] Create `src/components/AdminPage/subpages/AdminPprPage.tsx`
- [x] Create `src/components/PprRequestList/` — all requests with approve/reject actions
- [x] Create `src/containers/PprRequestListContainer.tsx`
- [x] Add PPR tab to `src/components/AdminPage/AdminPage.tsx` (hide when `__CONF__.ppr !== true`)
- [x] Add PPR nav item to AdminNavigation
- [x] Write tests: `PprRequestList/PprRequestList.spec.tsx`
- [x] The admin tab is in the URL (`#/admin?tab=<tab>`); the link `#/admin?tab=ppr&request=<key>` opens and focuses that request once a load of the list has succeeded and the settings are loaded, with a notice when it no longer exists or is already answered; it never answers anything; after a failed load the list shows an error and leaves the link to the next load; a newer load replaces the one running (the admin page and the list load together), so the list shows how the latest one went

### Phase 7: GDPR/DSGVO Compliance
- [x] Create `functions/ppr/cleanup.js` — scheduled function, deletes requests a set number of days past plannedDate
  - Admins set it in the privacy tab, which shows when `ppr` or `privacySettings` is on (`/settings/ppr/retentionDays`; whole days, 1–3650; without a value nothing is deleted, as for movements and messages)
- [x] Register cleanup in `functions/index.js` as pubsub.schedule trigger
- [x] Ensure delete endpoint validates ownership server-side (done in Phase 2f)
- [x] Audit all Cloud Function handlers: no PII in logs (keys + status only)
- [x] Audit email templates: minimal content, no phone numbers

### Phase 8: Movement–PPR Link (Deferred)
- [ ] Add optional PPR dropdown to departure wizard FlightPage (when `__CONF__.ppr`)
- [ ] Store `pprRequestKey` on movement
- [ ] Mark PPR as used when movement is saved

### Phase 9: Cypress E2E
- [ ] `cypress/e2e/ppr-request-flow.cy.ts` — pilot submits, checks status
- [ ] `cypress/e2e/ppr-admin-flow.cy.ts` — admin approves/rejects

### Phase 10: Automatic Answers
- [x] Settings in the PPR admin tab ("Einstellungen"), stored at `/settings/ppr` like the address
  - `answerMode`: `manual` (default) or `automatic`
  - `pilotInfo`: the information automatic approvals carry (runway, circuit, landing fee, phone; at most 1000 characters)
  - `closures` ("Gesperrte Tage" / blocked days in the app: days without PPR visitors, often while the aerodrome is open): `[{ from, to, reason }]`, at most 50; the form shows those that have not ended, so the next save removes the others; blocking a day leaves the requests made before as they are (admins reject or revoke them in the list)
- [x] `functions/ppr/domain/pprAnswer.js` decides on submission, in this order:
  - planned date on a blocked day → rejected with its reason (also with manual answers)
  - planned date today while the aerodrome status (`/status`, the admin tab "Flugplatz-Status") is closed → rejected with its details (the status tells about today only)
  - automatic answers → approved with the information for pilots
  - otherwise pending, for an admin
- [x] Answered requests are saved with their answer (`reviewedBy: 'automatic'`), never pending in between; the pilot gets the answer by email right away, the admin email shows it ("Automatisch genehmigt"); with automatic answers no notification address is needed
- [x] Automatic approval emails ask the pilot to check the aerodrome status and the NOTAMs before the flight
- [x] The form shows the answer after sending; the admin list marks automatic answers
- [x] Admins revoke an approval with a reason (e.g. a day blocked later); the pilot gets it by email (`ppr-revoked` templates)
- [x] The settings box shows a summary (answer mode, up to three upcoming blocked periods, the address or the missing-address warning) until "Bearbeiten"; "Abbrechen" discards the changes; a successful save closes the form and shows "Gespeichert!" (the shared SuccessMessage) for 5 s, announced by a live region that stays on the page while the summary and the form take turns; a failed save keeps the form open with the error; the second click of a double click does nothing to what moves under the pointer: the options of the form opening on "Bearbeiten", and the request list moving up when the form closes (no request is answered or closed)
- [x] With `ppr` on, the "Flugplatz-Status" tab notes that the status «Geschlossen» rejects PPR requests for today
- [x] The admin list and the pilot's list show the requests in groups: «Offen» (pending, planned for today or later, the next first), «Bevorstehend» (answered, today or later) and «Vergangen» (planned before today, the most recent first; the 10 most recent, the others with «Ältere anzeigen», a linked one always); the admin tab counts the open ones
- [ ] Later: scheduled aerodrome statuses on the "Flugplatz-Status" tab, shown by the banner, the status page and the API, and rejected by PPR too, so a planned closure of the whole aerodrome is entered once; to decide: a manual status during a planned period, times of day, the API fields

### Phase 11: Requests without login (`pprGuestRequests`)
- [x] Flag `pprGuestRequests` per project (default `false`, on in lspl's test environment), only where `ppr` is on; written as `guestRequests` to `functions/ppr-config.generated.js`; a value other than a boolean, or the flag without `appUrl`, fails the deploy
- [x] Status links for every request, with or without login: each pilot email (receipt, answer, revocation) gets a token of its own; only its SHA-256 hash is stored, in `statusTokens` on the request (`{ <hash>: <ms> }`), in the same write or transaction as the request or its answer; the lists never return the hashes; the link is `<appUrl>/#/ppr/status/<key>/<token>`
- [x] Receipt email for every pending request (`ppr-received` templates, de/en): only registration, date and time, the status link and a note for whoever did not make the request; a request answered on submission gets the answer only, which then carries a note that whoever did not make it can ignore it (requests without login); answer and revocation emails carry the status link
- [x] The registration is the one value a pilot types that these emails show: the server takes letters, digits and hyphens only, as the app sends them (mail clients would turn e.g. `EVIL.XYZ` into a link)
- [x] Routes without login (`publicRoutes.js`) at `/ppr` only, ahead of the permissive CORS: CORS for the app's origins only (`appUrl`, the project's Hosting domains, the dev server), JSON only (415)
  - `POST /ppr/guest-requests` (only with the flag): strict, lower-cased address; no `createdBy`, `withoutLogin: true` set by the server; 201 `{ key, status, reviewRemarks?, statusToken, emailSent }`; `emailSent` is false when the receipt or answer could not be sent, and the form then asks the pilot to open the status and bookmark it
  - `POST /ppr/status/:key` (wherever `ppr` is on): the status without personal data for the `{ token }` in the body
  - `POST /ppr/status/:key/withdraw`: deletes a pending request (atomic `removeIf` checking the token and the status); 409 when it is no longer pending; no email to the aerodrome
- [x] `POST /ppr/requests` (with login) also returns the status token and sends the receipt
- [x] Limits without login: 10 per client and hour (the rightmost `X-Forwarded-For` entry, IPv6 by its /64), 5 per mailbox and hour and 10 per mailbox and day (`mailboxKey`), as SHA-256 hashes under `/pprGuestRateLimits`, pruned by the daily cleanup; the same 429 with `Retry-After` for all; rejected submissions give their slots back
- [ ] Later, if requests without login are abused: a way for admins to delete a request without emailing the address (today they can only reject it, which emails it), and possibly a limit for the whole project
- [x] The aerodrome's email and the admin list mark requests without login ("Ohne Anmeldung gestellt – E-Mail-Adresse nicht bestätigt"); they never appear under «Meine PPR-Anfragen»
- [x] Intro at `#/ppr/new` for visitors without login: «Mit Anmeldung fortfahren» (where `loginForm` is `email`) or «Ohne Anmeldung fortfahren» (with the flag); the form without login at `#/ppr/guest`; the status page at `#/ppr/status/<key>/<token>`, where a pending request can be withdrawn; kiosk sessions are sent to the start page
- [x] Website link `<appUrl>/ppr` (turned into `#/ppr/new` before the router starts), shown with copy button and QR code in the PPR admin tab; Sentry redacts the status links
- [x] Docs: `projects/Configuration.md` (`pprGuestRequests`, the website link)
- [ ] Check once on lspl-test that the rightmost `X-Forwarded-For` entry on the function's URL is the client's address (one front-end hop): send a made-up entry and compare
- [ ] Manual test on lspl-test: request without login, receipt, status page, withdrawal, answer emails with the link, limits, kiosk without PPR, the website link
- [ ] Cypress: cypress-testing has PPR off and username/password login; the flow without login would need a PPR config for that project and sends real emails, so it is covered by Jest and the manual test for now

### Final Verification
- [ ] `npm test` — all Jest tests pass
- [ ] `npm run typecheck` — no TS errors
- [ ] `npm run test:functions` — Cloud Functions tests pass
- [ ] Manual test: pilot submits PPR at a PPR aerodrome
- [ ] Manual test: admin approves/rejects in admin panel
- [ ] Manual test: email notifications received
- [ ] Manual test: non-PPR aerodromes completely unaffected

---

## Implementation Order

1. **Phase 1** — config (foundation)
2. **Phase 2** — hexagonal backend + HTTP API
3. **Phase 3** — i18n
4. **Phase 4** — Redux module (HTTP client)
5. **Phase 5** — pilot UI
6. **Phase 6** — admin UI
7. **Phase 7** — GDPR compliance
8. **Phase 9** — E2E tests
9. **Phase 8** — movement link (deferred)

**MVP = Phases 1–7.** Movement link (Phase 8) can wait.

---

## Future Migration Path

When replacing Firebase:
1. Write `adapters/postgresPprRepository.js` implementing the same port → swap one import
2. Move HTTP endpoints from Cloud Functions to Next.js API routes → same use cases
3. Domain, use cases, notifier — **zero changes**
4. Frontend `remote.ts` — update base URL (or keep same if behind API gateway)
