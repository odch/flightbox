# Configuration

## Projects

All project configurations are located in the `projects` directory. There is one JSON file for each
project.

## Properties

* `aerodrome`
  * `name`
  * `ICAO`
  * `runways`
  * `departureRoutes`
  * `arrivalRoutes`
* `environments`
  * `test`
  * `production`
* `theme`
* `title`
* `enabledFlightTypes`

### `aerodrome`

#### `name`

Human readable name of the aerodrome.

Example: `"Lommis"`

#### `ICAO`

ICAO code of the aerodrome.

Example: `"LSZT"`

#### `runways`

Array of all runways of the aerodrome.

Example: `[ "06", "24" ]`

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

### `environments`

Description of the environments. Each environment description consists of the following properties:
* `firebase`: The URL of the firebase instance.
* `ipAuth`: The URL of the IP authentication service.
* `credentialsAuth`: The URL of the credentials authentication service.

#### `test`

Description of the test environment.

#### `production`

Description of the production environment.

### `theme`

The name of the theme to use (must exist in the `theme` directory in the project root). The default theme is "lszt".

### `title`

The title of the browser window.

Example: `"MFGT Bewegungen"`

### `enabledFlightTypes`

A list of the enabled flight types.

Available flight types: `private`, `commercial`, `instruction`, `aerotow`, `paradrop`.

Enabled by default: `private`, `commercial`, `instruction`.

Example: `["private", "commercial"]`

## Full example


```json
{
  "aerodrome": {
    "name": "Lommis",
    "ICAO": "LSZT",
    "runways": [
      "06",
      "24"
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
      "firebase": "https://mfgt-flights-redux.firebaseio.com",
      "ipAuth": "https://mfgt-flights-auth-test.appspot.com/ip",
      "credentialsAuth": "https://mfgt-flights-auth-test.appspot.com/mfgt"
    },
    "production": {
      "firebase": "https://lszt.firebaseio.com",
      "ipAuth": "https://api.mfgt.ch/api/v1/firebaseauth/ip",
      "credentialsAuth": "https://api.mfgt.ch/api/v1/firebaseauth/mfgt"
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
