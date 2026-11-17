'use strict'

const { decideAnswer, manualAnswerReason } = require('./pprAnswer')

const TODAY = '2026-11-13'
const request = { plannedDate: '2026-11-20', plannedTime: '14:30' }

const options = (overrides = {}) => ({
  answerMode: 'manual',
  pilotInfo: null,
  closures: [],
  aerodromeStatus: null,
  today: TODAY,
  ...overrides
})

describe('decideAnswer', () => {
  it('leaves a request to the admins with manual answers', () => {
    expect(decideAnswer(request, options())).toBeNull()
  })

  it('approves with the information for pilots with automatic answers', () => {
    expect(decideAnswer(request, options({ answerMode: 'automatic', pilotInfo: 'Runway 05/23, landing fee CHF 20' })))
      .toEqual({ status: 'approved', reviewRemarks: 'Runway 05/23, landing fee CHF 20' })
  })

  it('approves without remarks when there is no information for pilots', () => {
    expect(decideAnswer(request, options({ answerMode: 'automatic' })))
      .toEqual({ status: 'approved', reviewRemarks: null })
  })

  describe('closures', () => {
    const closures = [
      { from: '2026-11-19', to: '2026-11-21', reason: 'Runway works' },
      { from: '2026-12-24', to: '2026-12-24', reason: 'Christmas' }
    ]

    it.each(['2026-11-19', '2026-11-20', '2026-11-21'])('rejects a request for %s within a closure, in both modes', plannedDate => {
      for (const answerMode of ['manual', 'automatic']) {
        expect(decideAnswer({ plannedDate }, options({ answerMode, closures })))
          .toEqual({ status: 'rejected', reviewRemarks: 'Runway works' })
      }
    })

    it('rejects a request on a one-day closure', () => {
      expect(decideAnswer({ plannedDate: '2026-12-24' }, options({ closures })))
        .toEqual({ status: 'rejected', reviewRemarks: 'Christmas' })
    })

    it.each(['2026-11-18', '2026-11-22'])('does not reject a request for %s outside the closures', plannedDate => {
      expect(decideAnswer({ plannedDate }, options({ closures }))).toBeNull()
      expect(decideAnswer({ plannedDate }, options({ answerMode: 'automatic', closures })))
        .toEqual({ status: 'approved', reviewRemarks: null })
    })
  })

  describe('aerodrome status', () => {
    const closed = { status: 'closed', details: 'Closed due to thunderstorms' }

    it('rejects a request for today while the aerodrome is closed, in both modes', () => {
      for (const answerMode of ['manual', 'automatic']) {
        expect(decideAnswer({ plannedDate: TODAY }, options({ answerMode, aerodromeStatus: closed })))
          .toEqual({ status: 'rejected', reviewRemarks: 'Closed due to thunderstorms' })
      }
    })

    it('rejects without remarks when the status has no details', () => {
      expect(decideAnswer({ plannedDate: TODAY }, options({ aerodromeStatus: { status: 'closed', details: '' } })))
        .toEqual({ status: 'rejected', reviewRemarks: null })
    })

    it('does not reject a request for a later day: the status tells about today', () => {
      expect(decideAnswer(request, options({ answerMode: 'automatic', aerodromeStatus: closed })))
        .toEqual({ status: 'approved', reviewRemarks: null })
    })

    it.each(['open', 'restricted'])('does not reject a request for today while the status is %s', status => {
      expect(decideAnswer({ plannedDate: TODAY }, options({ aerodromeStatus: { status, details: 'x' } }))).toBeNull()
    })
  })

  it('gives the reason of a closure before the aerodrome status', () => {
    const answer = decideAnswer({ plannedDate: TODAY }, options({
      closures: [{ from: TODAY, to: TODAY, reason: 'Air show' }],
      aerodromeStatus: { status: 'closed', details: 'Thunderstorms' }
    }))
    expect(answer).toEqual({ status: 'rejected', reviewRemarks: 'Air show' })
  })
})

describe('manualAnswerReason', () => {
  const HELICOPTERS = { helicopters: true, mtowFrom: null }
  // lszm: all helicopters, other aircraft from 2250 kg
  const LSZM = { helicopters: true, mtowFrom: 2250 }
  // As the pilot declared it
  const declared = (aircraftCategory, mtow) => ({ ...request, aircraftCategory, mtow })

  it.each(['Hubschrauber', 'Eigenbauhubschrauber'])('leaves a %s to an admin, whatever its MTOW', category => {
    expect(manualAnswerReason(declared(category, 700), LSZM)).toEqual({ reason: 'helicopter' })
    expect(manualAnswerReason(declared(category, 3500), HELICOPTERS)).toEqual({ reason: 'helicopter' })
  })

  it.each(['Flugzeug', 'Ultraleicht Tragschrauber', 'Motorsegler'])('answers a %s automatically under the limit', category => {
    expect(manualAnswerReason(declared(category, 2249), LSZM)).toBeNull()
    expect(manualAnswerReason(declared(category, 5700), HELICOPTERS)).toBeNull()
  })

  it.each([2250, 5700])('leaves an aircraft of %i kg to an admin from the limit on, the limit included', mtow => {
    expect(manualAnswerReason(declared('Flugzeug', mtow), LSZM)).toEqual({ reason: 'mtow', mtowFrom: 2250 })
    expect(manualAnswerReason(declared('Flugzeug', mtow), { helicopters: false, mtowFrom: 2250 }))
      .toEqual({ reason: 'mtow', mtowFrom: 2250 })
  })

  it('leaves nothing to an admin without manual answers', () => {
    for (const manualAnswers of [{ helicopters: false, mtowFrom: null }, undefined]) {
      expect(manualAnswerReason(declared('Hubschrauber', 9000), manualAnswers)).toBeNull()
    }
  })
})

describe('decideAnswer with manual answers', () => {
  const LSZM = { helicopters: true, mtowFrom: 2250 }
  const automatic = (overrides = {}) =>
    options({ answerMode: 'automatic', pilotInfo: 'Runway 05/23', manualAnswers: LSZM, ...overrides })
  const declared = (aircraftCategory, mtow) => ({ ...request, aircraftCategory, mtow })

  it('leaves a helicopter and a heavy aircraft to an admin', () => {
    expect(decideAnswer(declared('Hubschrauber', 1370), automatic())).toBeNull()
    expect(decideAnswer(declared('Flugzeug', 2250), automatic())).toBeNull()
  })

  it('approves the other aircraft automatically', () => {
    expect(decideAnswer(declared('Flugzeug', 1100), automatic()))
      .toEqual({ status: 'approved', reviewRemarks: 'Runway 05/23' })
  })

  it('rejects a helicopter for a closure all the same', () => {
    const closures = [{ from: '2026-11-20', to: '2026-11-20', reason: 'Air show' }]
    expect(decideAnswer(declared('Hubschrauber', 1370), automatic({ closures })))
      .toEqual({ status: 'rejected', reviewRemarks: 'Air show' })
  })

  it('leaves a helicopter to an admin with manual answers too', () => {
    expect(decideAnswer(declared('Hubschrauber', 1370), automatic({ answerMode: 'manual' }))).toBeNull()
  })
})
