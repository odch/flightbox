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
