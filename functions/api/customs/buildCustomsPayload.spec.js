const {
  buildCustomsPayload,
  getCustomsAircraftType,
  parseDuration,
  calculateArrivalTime,
  formatDate,
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

    it('formats the date as Swiss-German short date', () => {
      expect(formatDate('2026-08-17')).toBe('17.08.2026')
    })
  })

  describe('buildCustomsPayload', () => {
    const customsSettings = { aerodrome: 'LSZT', baseUrl: 'https://customs', accessToken: 't' }

    it('builds a departure payload from the stored movement (server-side)', async () => {
      const db = makeDb({
        departures: {
          'mov-1': {
            location: 'LSZF',
            date: '2026-08-17',
            time: '10:00',
            duration: '01:30',
            phone: '+41 79 000 00 00',
            email: 'pilot@example.ch',
            immatriculation: 'HBKOF',
            mtow: 750,
            aircraftCategory: 'Flugzeug',
          },
        },
        aerodromes: { LSZF: { country: 'CH', name: 'Birrfeld' } },
        customsSettings,
      })

      const payload = await buildCustomsPayload(db, 'departure', 'mov-1')

      expect(payload).toEqual({
        aerodromeId: 'lszt', // from server config, lowercased — never the client
        externalId: 'mov-1', // server-derived from the movement key
        data: {
          direction: 'departure',
          date: '17.08.2026',
          phone: '+41 79 000 00 00',
          email: 'pilot@example.ch',
          registration: 'HBKOF',
          mtow: 750,
          aircraftType: 'airplane',
          departureTime: '10:00',
          arrivalCountry: 'CH',
          arrivalLocation: 'Birrfeld',
          arrivalTime: '11:30',
        },
      })
    })

    it('builds an arrival payload with departure-origin fields', async () => {
      const db = makeDb({
        arrivals: {
          'arr-9': {
            location: 'EDNY',
            date: '2026-08-17',
            time: '14:00',
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
        departures: { 'mov-2': { location: 'LSZF', date: '2026-08-17', time: '09:00', duration: '00:30', aircraftCategory: 'Flugzeug' } },
        aerodromes: { LSZF: { country: 'CH', name: 'Birrfeld' } },
        customsSettings: null,
      })
      const payload = await buildCustomsPayload(db, 'departure', 'mov-2')
      expect(payload.aerodromeId).toBeNull()
    })

    it('tolerates a missing aerodrome record (undefined country/name)', async () => {
      const db = makeDb({
        departures: { 'mov-3': { location: 'ZZZZ', date: '2026-08-17', time: '09:00', duration: '00:30', aircraftCategory: 'Flugzeug' } },
        aerodromes: {},
        customsSettings,
      })
      const payload = await buildCustomsPayload(db, 'departure', 'mov-3')
      expect(payload.data.arrivalCountry).toBeUndefined()
      expect(payload.data.arrivalLocation).toBeUndefined()
    })
  })
})
