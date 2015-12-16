# MFGT Fluganmeldungen

### Directory Layout

```
.
├── /build/                     # The folder for compiled output
├── /node_modules/              # 3rd-party libraries and utilities
├── /components/                # React components
├── /test/                      # Unit and integration tests
│── app.js                      # The main JavaScript file (entry point)
│── package.json                # Dev dependencies and NPM scripts
└── README.md                   # Project overview
```

### Getting Started

```
$ npm install
$ npm run build
$ npm start
```

Then open [http://0.0.0.0:8080/webpack-dev-server/](http://0.0.0.0:8080/webpack-dev-server/) in your browser.

### How to Test

```
$ npm test
```

### How to Deploy

```
$ npm install
$ npm run build
```

Copy index.html and build directory to the server.
