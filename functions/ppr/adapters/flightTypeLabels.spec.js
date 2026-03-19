'use strict'

const { FLIGHT_TYPE_LABELS_DE, flightTypeLabel } = require('./flightTypeLabels')
const de = require('../../../src/locales/de.json')

describe('PPR flight type labels', () => {
  it('matches the flight type labels of the German client locale', () => {
    expect(FLIGHT_TYPE_LABELS_DE).toEqual(de.flightTypes)
  })

  it('returns the German label for a known flight type', () => {
    expect(flightTypeLabel('private')).toBe('Privat')
    expect(flightTypeLabel('glider_private_aerotow')).toBe('Privat (Schlepp)')
  })

  it.each(['unknown', 'Private', '', 'constructor', '__proto__', 'toString'])(
    'returns %p unchanged when it is not a known flight type',
    flightType => {
      expect(flightTypeLabel(flightType)).toBe(flightType)
    }
  )
})
