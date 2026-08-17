const {
  buildCustomsPayload,
  getCustomsAircraftType,
  parseDuration,
  calculateArrivalTime,
  formatDate,
  toLocalDateTimeParts,
} = require('./buildCustomsPayload')

const makeSnapshot = (val) => ({
  exists: () => val !== null && val !== undefined,
  val: () => val,
})

// Minimal RTDB db mock keyed by path. Supports:
//   db.ref('/departures').child(key).once()
//   db.ref('/arrivals').child(key).once()
//   db.ref('/aerodromes').child(icao).once()
//   db.ref('/settings/customsDeclarationApp').once()
const makeDb = ({ departures = {}, arrivals = {}, aerodromes = {}, customsSettings = null }) => ({
  ref: (path) => {
    if (path === '/departures') {
      return { child: (k) => ({ once: async () => makeSnapshot(departures[k] ?? null) }) }
    }
    if (path === '/arrivals') {
      return { child: (k) => ({ once: async () => makeSnapshot(arrivals[k] ?? null) }) }
    }
    if (path === '/aerodromes') {
      return { child: (icao) => ({ once: async () => makeSnapshot(aerodromes[icao] ?? null) }) }
    }
    if (path === '/settings/customsDeclarationApp') {
      return { once: async () => makeSnapshot(customsSettings) }
    }
    throw new Error(`unexpected ref path: ${path}`)
  },
})

describe('functions/api/customs/buildCustomsPayload', () => {
  describe('pure helpers', () => {
    it('maps helicopter categories', () => {
      expect(getCustomsAircraftType('Hubschrauber')).toBe('helicopter')
      expect(getCustomsAircraftType('Eigenbauhubschrauber')).toBe('helicopter')
      expect(getCustomsAircraftType('Flugzeug')).toBe('airplane')
    })

    it('parses duration', () => {
      expect(parseDuration('01:30')).toEqual({ hours: 1, minutes: 30 })
      expect(parseDuration('00:45')).toEqual({ hours: 0, minutes: 45 })
    })

    it('adds duration to departure time', () => {
      expect(calculateArrivalTime('10:00', '01:30')).toBe('11:30')
      expect(calculateArrivalTime('23:30', '01:00')).toBe('00:30')
    })

    it('returns null arrival time when the base time is missing', () => {
      expect(calculateArrivalTime(null, '01:00')).toBeNull()
    })

    it('formats a local date as Swiss-German short date', () => {
      expect(formatDate('2026-08-17')).toBe('17.08.2026')
      expect(formatDate(null)).toBeNull()
    })

    it('splits an ISO-UTC dateTime into Europe/Zurich local parts (DST-aware)', () => {
      // 2026-08-17 is CEST (UTC+2): 08:00Z -> 10:00 local.
      expect(toLocalDateTimeParts('2026-08-17T08:00:00.000Z')).toEqual({
        localDate: '2026-08-17',
        localTime: '10:00',
      })
      // A winter date is CET (UTC+1): 08:00Z -> 09:00 local.
      expect(toLocalDateTimeParts('2026-01-15T08:00:00.000Z')).toEqual({
        localDate: '2026-01-15',
        localTime: '09:00',
      })
    })

    it('returns null parts for a missing/invalid dateTime', () => {
      expect(toLocalDateTimeParts(undefined)).toEqual({ localDate: null, localTime: null })
      expect(toLocalDateTimeParts('not-a-date')).toEqual({ localDate: null, localTime: null })
    })
  })

  describe('buildCustomsPayload', () => {
    const customsSettings = { aerodrome: 'LSZM', baseUrl: 'https://customs', accessToken: 't' }

    it('builds a departure payload from the stored movement (server-side)', async () => {
      const db = makeDb({
        departures: {
          'mov-1': {
            // Stored shape: a combined ISO-UTC dateTime + duration (NOT date/time).
            dateTime: '2026-08-17T08:00:00.000Z', // CEST -> 10:00 local
            duration: '01:30',
            location: 'LFLY',
            phone: '+41 79 000 00 00',
            email: 'pilot@example.ch',
            immatriculation: 'HBKLA',
            mtow: 1100,
            aircraftCategory: 'Flugzeug',
          },
        },
        aerodromes: { LFLY: { country: 'FR', name: 'LYON CORBAS AIRFIELD' } },
        customsSettings,
      })

      const payload = await buildCustomsPayload(db, 'departure', 'mov-1')

      expect(payload).toEqual({
        aerodromeId: 'lszm', // from server config, lowercased — never the client
        externalId: 'mov-1', // server-derived from the movement key
        data: {
          direction: 'departure',
          date: '17.08.2026', // derived from dateTime, not a raw (absent) date field
          phone: '+41 79 000 00 00',
          email: 'pilot@example.ch',
          registration: 'HBKLA',
          mtow: 1100,
          aircraftType: 'airplane',
          departureTime: '10:00',
          arrivalCountry: 'FR',
          arrivalLocation: 'LYON CORBAS AIRFIELD',
          arrivalTime: '11:30',
        },
      })
    })

    it('builds an arrival payload with departure-origin fields', async () => {
      const db = makeDb({
        arrivals: {
          'arr-9': {
            dateTime: '2026-08-17T12:00:00.000Z', // CEST -> 14:00 local
            location: 'EDNY',
            phone: '+49 1',
            email: 'g@example.de',
            immatriculation: 'DKABC',
            mtow: 900,
            aircraftCategory: 'Hubschrauber',
          },
        },
        aerodromes: { EDNY: { country: 'DE', name: 'Friedrichshafen' } },
        customsSettings,
      })

      const payload = await buildCustomsPayload(db, 'arrival', 'arr-9')

      expect(payload.externalId).toBe('arr-9')
      expect(payload.data).toMatchObject({
        direction: 'arrival',
        date: '17.08.2026',
        aircraftType: 'helicopter',
        arrivalTime: '14:00',
        departureCountry: 'DE',
        departureLocation: 'Friedrichshafen',
      })
      // Departure-direction-only fields must not be present on an arrival.
      expect(payload.data.departureTime).toBeUndefined()
      expect(payload.data.arrivalCountry).toBeUndefined()
    })

    it('returns null when the movement does not exist', async () => {
      const db = makeDb({ departures: {}, customsSettings })
      const payload = await buildCustomsPayload(db, 'departure', 'missing')
      expect(payload).toBeNull()
    })

    it('returns null for an unknown movement type', async () => {
      const db = makeDb({ customsSettings })
      const payload = await buildCustomsPayload(db, 'taxi', 'mov-1')
      expect(payload).toBeNull()
    })

    it('sets aerodromeId to null when customs is not configured', async () => {
      const db = makeDb({
        departures: { 'mov-2': { dateTime: '2026-08-17T07:00:00.000Z', duration: '00:30', location: 'LFLY', aircraftCategory: 'Flugzeug' } },
        aerodromes: { LFLY: { country: 'FR', name: 'Lyon' } },
        customsSettings: null,
      })
      const payload = await buildCustomsPayload(db, 'departure', 'mov-2')
      expect(payload.aerodromeId).toBeNull()
    })

    it('tolerates a missing aerodrome record (undefined country/name)', async () => {
      const db = makeDb({
        departures: { 'mov-3': { dateTime: '2026-08-17T07:00:00.000Z', duration: '00:30', location: 'ZZZZ', aircraftCategory: 'Flugzeug' } },
        aerodromes: {},
        customsSettings,
      })
      const payload = await buildCustomsPayload(db, 'departure', 'mov-3')
      expect(payload.data.arrivalCountry).toBeUndefined()
      expect(payload.data.arrivalLocation).toBeUndefined()
      // Date/time still resolve from dateTime even without the aerodrome record.
      expect(payload.data.date).toBe('17.08.2026')
      expect(payload.data.departureTime).toBe('09:00')
    })
  })
})
