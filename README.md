# open digital Flightbox

[![wercker status](https://app.wercker.com/status/0fe66b2964c401ddbc2b7b17d2e9f3d0/s/master "wercker status")](https://app.wercker.com/project/byKey/0fe66b2964c401ddbc2b7b17d2e9f3d0)
[![devDependencies Status](https://david-dm.org/lszt/flights-react/dev-status.svg)](https://david-dm.org/lszt/flights-react?type=dev)
[![GitHub release](https://img.shields.io/github/release/odch/flightbox.svg)](https://www.github.com/odch/flightbox/releases/)

### Getting Started

Node Version: 10

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

Set the realtime database name for the cloud functions:

```
firebase functions:config:set rtdb.instance={RTDB NAME}
```

(e.g. `firebase functions:config:set rtdb.instance=lszt-test`)

##### Deploy everything including cloud functions

```
$ firebase deploy
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
