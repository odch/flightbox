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
  * `landingFees`
  * `goAroundFees`
* `environments`
  * `test`
  * `production`
* `theme`
* `title`
* `enabledFlightTypes`
* `reportApiEnabled`
* `customsSelfDeclarationEnabled`

### `aerodrome`

#### `name`

Human readable name of the aerodrome.

Example: `"Lommis"`

#### `ICAO`

ICAO code of the aerodrome.

Example: `"LSZT"`

#### `runways`

Array of all runways of the aerodrome. Each runway is described with `name` and `type` (`A` for asphalt,
`G` for grass); the type is reported in the airstat report.

Example: `[ { "name": "06", "type": "G" }, { "name": "24", "type": "G" } ]`

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

#### `goAroundFees`

Same structure for the go arounds as for the landings. If no go around fees are defined, the pilots won't be charged
for go arounds.

### `environments`

Description of the environments. Each environment description consists of the following properties:
* `firebaseProjectId`: The Firebase project. Required: the functions deploy fails without it.
* `firebaseDatabaseUrl`: The URL of the Realtime Database.
* `firebaseApiKey`: The Firebase web API key.

#### `test`

Description of the test environment.

#### `production`

Description of the production environment.

A property set in an environment replaces the top-level property of the same name in the app's configuration
and in the functions' generated config (`reportApiEnabled`, `memberManagement`, `aerodrome`), e.g.
`"reportApiEnabled": true` in `test` only. `theme`, the landing and go-around fees and `privacySettings` are
always read from the top level.

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

### `reportApiEnabled`

Enables the airstat report API (`GET /api/v1/reports/airstat`) in the Cloud Functions, the API key
endpoints and the "API-Zugriff" tab in the admin area, where admins create the keys for external programs.
Disabled by default.

The functions get this flag and the aerodrome data they need from `functions/project-config.generated.json`, which
the deploy writes with `node tasks/generateServerConfig.js <project> <test|production> <file> [<Firebase project>]`
(with the Firebase project given, a config for another project fails instead of being ignored at runtime).

Example: `true`

### `customsSelfDeclarationEnabled`

Enables the "Zoll-Selbstdeklaration" tab in the admin area, where admins list the logins (e-mail addresses) whose
declarations the customs declaration app forwards to the authorities without review by the aerodrome. The tab is
only shown when the customs integration is configured (`/settings/customsDeclarationApp`). Disabled by default.

Example: `true`

## Full example


```json
{
  "aerodrome": {
    "name": "Lommis",
    "ICAO": "LSZT",
    "runways": [
      {
        "name": "06",
        "type": "G"
      },
      {
        "name": "24",
        "type": "G"
      }
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
      "firebaseProjectId": "lszt-test",
      "firebaseDatabaseUrl": "https://lszt-test-default-rtdb.europe-west1.firebasedatabase.app",
      "firebaseApiKey": "<API key>"
    },
    "production": {
      "firebaseProjectId": "lszt-prod",
      "firebaseDatabaseUrl": "https://lszt-prod-default-rtdb.europe-west1.firebasedatabase.app",
      "firebaseApiKey": "<API key>"
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
