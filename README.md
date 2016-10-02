# MFGT Fluganmeldungen

[![wercker status](https://app.wercker.com/status/b9fc0aac2d1ad59ac7d88d1ade1581f3/s/master "wercker status")](https://app.wercker.com/project/byKey/b9fc0aac2d1ad59ac7d88d1ade1581f3)

### Getting Started

```
$ npm install
$ npm start
```

Then open [http://0.0.0.0:8080/webpack-dev-server/](http://0.0.0.0:8080/webpack-dev-server/) in your browser.

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

##### Development or test environment

```
$ npm run build
```

##### Production environment

```
$ npm run build:prod
```

#### Push to Firebase

Prerequisites: Firebase Tools must be installed (`npm install -g firebase-tools`).

**Caution:** Ensure that you have selected the right Firebase project (list all projects by typing `firebase list` and change it if necessary (with `firebase use`)).

```
$ firebase deploy
```
