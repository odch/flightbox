# open digital Flightbox

[![GitHub release](https://img.shields.io/github/release/odch/flightbox.svg)](https://www.github.com/odch/flightbox/releases/)

### Getting Started

#### Required Node Versions

Node Version for building the app: 20

Node Version for deploying to Firebase and for the cloud functions: 20

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

Node version for this step: 20

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
$ firebase deploy --only functions
```

## Cloud functions

### `auth`

Can be called to create a custom authentication token. Has to be called via **`POST`**.

There are two authentication modes implemented: `ip` and `flightnet`.

#### Mode *ip*

Returns a token if the request comes from one of the allowed IP addresses. The allowed addresses can be configured
via the configuration property `auth.ips`. The following example sets the IP addresses `109.205.200.60` and
`77.59.197.122` as allowed IP addresses.

```
$ firebase functions:config:set auth.ips="109.205.200.60,77.59.197.122" 
```

Request example:
```
$ curl \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"mode": "ip"}' \
    https://us-central1-<PROJECT_ID>.cloudfunctions.net/auth
```

#### Mode *flightnet*

Returns a token if the given credentials are valid Flightnet credentials. You have to send the flightnet company,
the username and the password in the request body.

Request example:

```
$ curl \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"mode": "flightnet", "company": "<FLIGHTNET_COMPANY>", "username": "<FLIGHTNET_USERNAME>", "password": "<FLIGHTNET_PASSWORD>"}' \
    https://us-central1-<PROJECT_ID>.cloudfunctions.net/auth
```

##### Test credentials #####

For testing purposes, test credentials can be set for this mode. If test credentials are set, authentication will
**never** be delegated to the Flightnet authentication service.

Set the test credentials in the function config:
```
$ firebase functions:config:set auth.testcredentials.username="foo"
$ firebase functions:config:set auth.testcredentials.password="bar"
```

Request example (`company` not needed in request body):
```
curl \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"mode": "flightnet", "username": "foo", "password": "bar"}' \
    https://us-central1-<PROJECT_ID>.cloudfunctions.net/auth
```

### API

URL: `https://us-central1-<PROJECT_ID>.cloudfunctions.net/api`

#### Aerodrome status ####

Returns the current aerodrome status.

`GET /api/aerodrome/status`

Returns (example):
```
{
  status: "closed",
  last_update_by: "Hans Meier",
  last_update_date: "2020-04-12T22:29:01.565Z",
  message: "Flugplatz geschlossen. Kinderspielplatz und Restaurant geschlossen."
}
```

If no status is set, `{}` is returned.

#### Import users ####

##### Request #####

POST an array of users to this endpoint to sync the users list.

New users are added, existing ones are updated, and those which are saved in the database, but not present in the given
users array are removed from the database.

Example payload:
```
POST /api/users/import

{
  "users": [
    {
      "memberNr": "48434",
      "firstname": "John",
      "lastname": "Doe",
      "phone": "+41791234567",
      "email": "john.doe@example.com"
    },
    {
      "memberNr": "30443",
      "firstname": "Jane",
      "lastname": "Smith",
      "phone": "+41791234568",
      "email": "jane.smith@example.com"
    },
    ...
  ]
}
```

##### Auth #####

This endpoint requires a Basic Auth header (username and password to use set in the function config:
`api.serviceuser.username` and `api.serviceuser.password`).
