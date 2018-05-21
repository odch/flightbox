# open digital Flightbox

[![wercker status](https://app.wercker.com/status/0fe66b2964c401ddbc2b7b17d2e9f3d0/s/master "wercker status")](https://app.wercker.com/project/byKey/0fe66b2964c401ddbc2b7b17d2e9f3d0)
[![devDependencies Status](https://david-dm.org/lszt/flights-react/dev-status.svg)](https://david-dm.org/lszt/flights-react?type=dev)
[![GitHub release](https://img.shields.io/github/release/odch/flightbox.svg)](https://www.github.com/odch/flightbox/releases/)

### Getting Started

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

Prerequisites: Firebase Tools must be installed (`npm install -g firebase-tools`).

**Caution:** Ensure that you have selected the right Firebase project (list all projects by typing `firebase list` and change it if necessary (with `firebase use`)).

```
$ firebase deploy
```
## Cloud functions

### `auth`

Can be called to create a custom authentication token. Has to be called via **`POST`**.

You need to set the configuration properties `serviceaccount.clientemail` and `serviceaccount.privatekey`
before you'll be able to deploy the function (and the private key needs to be wrapped in double quotes - see example
below). You'll find the credentials for the service account in the console of your Firebase project.

```
$ firebase functions:config:set serviceaccount.clientemail="<EMAIL>"
$ firebase functions:config:set serviceaccount.privatekey="\"-----BEGIN PRIVATE KEY-----\n<PRIVATE KEY>\n-----END PRIVATE KEY-----\n\""
```

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
