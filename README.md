# MFGT Fluganmeldungen

[![wercker status](https://app.wercker.com/status/0fe66b2964c401ddbc2b7b17d2e9f3d0/s/master "wercker status")](https://app.wercker.com/project/byKey/0fe66b2964c401ddbc2b7b17d2e9f3d0)
[![devDependencies Status](https://david-dm.org/lszt/flights-react/dev-status.svg)](https://david-dm.org/lszt/flights-react?type=dev)

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
