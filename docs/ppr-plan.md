# PPR (Prior Permission Required) Feature Plan

## Context

Aerodromes lszm, lsze, lspv (and soon lspl) are PPR — pilots must get permission before flying in. Currently they just publish a phone number. This feature digitizes that: pilots submit PPR requests, admins approve/reject, pilots get notified via email.

**Key constraints:**
- Firebase will eventually be replaced (likely Postgres). Hexagonal architecture — Firebase is a swappable repository adapter.
- All reads and writes go through backend Cloud Functions (HTTP endpoints). The frontend never talks to Firebase directly for PPR. No new Firebase database rules.
- Login required via existing email OTP flow — verifies the pilot's email, gives status tracking, no new auth needed. All PPR aerodromes already use email login.
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

**Key:** There's already an Express-based `api` Cloud Function (`functions/api/index.js`) with auth middleware (`fbAuth`, `fbAdminAuth`). PPR routes are added to this existing app — no new Cloud Functions, no extra cold starts.

### Backend structure — `functions/ppr/`

```
functions/ppr/
  domain/
    pprRequest.js          # entity factory + validation + status constants
  usecases/
    submitRequest.js       # create request, notify admin
    reviewRequest.js       # approve/reject, notify pilot
    listRequests.js        # query: all (admin) or by user
  ports/
    pprRepository.js       # repository interface (JSDoc)
    notifier.js            # notification interface (JSDoc)
  adapters/
    firebasePprRepository.js   # Firebase RTDB implementation
    emailNotifier.js           # nodemailer/SMTP implementation
    emailTemplates.js          # email HTML templates
  routes.js                # Express router mounted in api/index.js
```

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
- [ ] Set up `/settings/ppr/adminEmail` in Firebase for each aerodrome

### Phase 2: Hexagonal Backend (`functions/ppr/`)

#### 2a. Domain
- [x] Create `functions/ppr/domain/pprRequest.js` — entity factory + validation
  - Required fields: firstname, lastname, email, immatriculation, plannedDate, plannedTime, flightType
  - Phone is optional
  - Input sanitization: strip HTML, enforce max lengths (name: 100, immatriculation: 10, remarks: 500)
  - Validate formats: email, date (YYYY-MM-DD), time (HH:MM)
  - plannedDate must be in the future
  - Status constants: PENDING, APPROVED, REJECTED
- [x] Write tests: `functions/ppr/domain/pprRequest.spec.js`

#### 2b. Ports
- [x] Create `functions/ppr/ports/pprRepository.js` — JSDoc interface
  - `save(pprRequest) → { key }`
  - `updateStatus(key, { status, reviewedBy, reviewedAt, reviewRemarks })`
  - `findByKey(key) → pprRequest | null`
  - `findAll() → pprRequest[]`
  - `findByEmail(email) → pprRequest[]`
  - `deleteByKey(key) → void`
- [x] Create `functions/ppr/ports/notifier.js` — JSDoc interface
  - `notifyRequestSubmitted(pprRequest, adminEmail)`
  - `notifyRequestReviewed(pprRequest)`

#### 2c. Use cases
- [x] Create `functions/ppr/usecases/submitRequest.js`
  - Receives `{ repository, notifier }`, input, adminEmail
  - Creates entity, saves, notifies admin
- [x] Create `functions/ppr/usecases/reviewRequest.js`
  - Receives `{ repository, notifier }`, key, review
  - Validates exists + status transition (only pending → approved/rejected)
  - Sanitizes admin reviewRemarks
  - Updates status, notifies pilot
- [x] Create `functions/ppr/usecases/listRequests.js`
  - Admin: findAll(), Pilot: findByEmail()
- [x] Create `functions/ppr/usecases/deleteRequest.js`
  - Validates ownership (createdBy === email)
- [x] Write tests: `functions/ppr/usecases/submitRequest.spec.js`
- [x] Write tests: `functions/ppr/usecases/reviewRequest.spec.js`

#### 2d. Firebase adapter
- [x] Create `functions/ppr/adapters/firebasePprRepository.js`
  - Implements pprRepository using `admin.database().ref('/pprRequests')`
- [x] Write tests: `functions/ppr/adapters/firebasePprRepository.spec.js`

#### 2e. Email notifier
- [x] Extract shared SMTP utils from `functions/auth/sendSignInEmail.js` into `functions/email/smtp.js`
- [x] Create `functions/ppr/adapters/emailTemplates.js`
  - Request submitted → admin: pilot name, aircraft, date/time
  - Request approved → pilot: confirmation
  - Request rejected → pilot: with admin remarks
  - HTML-escape all user-supplied values; include text/plain alternative
- [x] Create `functions/ppr/adapters/emailNotifier.js`

#### 2f. Express router
- [x] Create `functions/ppr/routes.js`
  - `POST /requests` — pilot submits (fbAuth + rate limit)
  - `GET /requests` — list (fbAuth, server-side admin check)
  - `POST /requests/:key/review` — admin approves/rejects (fbAdminAuth)
  - `DELETE /requests/:key` — pilot deletes own (fbAuth, server-side ownership check)
  - Rate limiting: 10 requests/hour/user on submit
  - Validate `:key` format before querying
  - Generic error messages, proper HTTP status codes

#### 2g. Mount in API
- [ ] Add `api.use('(/api)?/ppr', pprRoutes)` to `functions/api/index.js`

#### Security tests (backend)
- [ ] HTML tags stripped from all string fields
- [ ] Oversized inputs rejected (remarks > 500 chars)
- [ ] Past dates rejected for plannedDate
- [ ] Non-admin cannot call review endpoint (403)
- [ ] Pilot cannot delete another pilot's request (403)
- [ ] Invalid status transitions rejected
- [ ] Unauthenticated requests return 401
- [ ] Email templates HTML-escape user input

### Phase 3: Internationalization
- [ ] Add `ppr.*` keys to `src/locales/de.json`
- [ ] Add `ppr.*` keys to `src/locales/en.json`
- [ ] Add `admin.ppr`, `nav.ppr` keys

### Phase 4: Redux Module (`src/modules/ppr/`)
- [ ] Create `src/modules/ppr/actions.ts` — LOAD, SUBMIT, UPDATE_STATUS, DELETE, SELECT
- [ ] Create `src/modules/ppr/reducer.ts` — `{ data, loading, selected, form: { submitted, commitFailed } }`
- [ ] Create `src/modules/ppr/remote.ts` — HTTP calls to API (fetch with auth token)
- [ ] Create `src/modules/ppr/sagas.ts` — load, submit, review, delete
- [ ] Create `src/modules/ppr/index.ts` — barrel export
- [ ] Register in `src/modules/index.ts` — combineReducers + fork sagas
- [ ] Write tests: `src/modules/ppr/reducer.spec.ts`
- [ ] Write tests: `src/modules/ppr/sagas.spec.ts`

### Phase 5: Pilot UI
- [ ] Create `src/components/PprRequestForm/` — single-page react-final-form
  - Aircraft: immatriculation, type, mtow (reuse wizard field components)
  - Pilot: name, email, phone (optional) — pre-populated from profile
  - Flight: plannedDate, plannedTime, flightType, remarks
  - Submit button
- [ ] Create `src/components/PprStatusList/` — pilot's own requests with status badges
- [ ] Create `src/containers/PprRequestFormContainer.tsx`
- [ ] Create `src/containers/PprStatusListContainer.tsx`
- [ ] Add PPR entry to `src/components/StartPage/EntryPoints.tsx` (when `__CONF__.ppr && !guest && !kiosk`)
- [ ] Add routes to `src/components/App/App.tsx`: `/ppr/new`, `/ppr`
- [ ] Write tests: `PprRequestForm.spec.tsx`
- [ ] Write tests: `PprStatusList.spec.tsx`

### Phase 6: Admin UI
- [ ] Create `src/components/AdminPage/subpages/AdminPprPage.tsx`
- [ ] Create `src/components/PprRequestList/` — all requests with approve/reject actions
- [ ] Create `src/containers/PprRequestListContainer.tsx`
- [ ] Add PPR tab to `src/components/AdminPage/AdminPage.tsx` (hide when `__CONF__.ppr !== true`)
- [ ] Add PPR nav item to AdminNavigation
- [ ] Write tests: `PprRequestList.spec.tsx`

### Phase 7: GDPR/DSGVO Compliance
- [ ] Create `functions/ppr/cleanup.js` — scheduled function, deletes requests 30 days past plannedDate
  - Configurable via `/settings/ppr/retentionDays` (default: 30)
- [ ] Register cleanup in `functions/index.js` as pubsub.schedule trigger
- [ ] Ensure delete endpoint validates ownership server-side (done in Phase 2f)
- [ ] Audit all Cloud Function handlers: no PII in logs (keys + status only)
- [ ] Audit email templates: minimal content, no phone numbers

### Phase 8: Movement–PPR Link (Deferred)
- [ ] Add optional PPR dropdown to departure wizard FlightPage (when `__CONF__.ppr`)
- [ ] Store `pprRequestKey` on movement
- [ ] Mark PPR as used when movement is saved

### Phase 9: Cypress E2E
- [ ] `cypress/e2e/ppr-request-flow.cy.ts` — pilot submits, checks status
- [ ] `cypress/e2e/ppr-admin-flow.cy.ts` — admin approves/rejects

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
