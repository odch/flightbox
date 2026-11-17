'use strict'

const getClosures = require('./getClosures')

// 2026-11-17 00:30 in Zurich, still the 16th in UTC
const NOW = Date.parse('2026-11-16T23:30:00Z')

function createSettings(closures) {
  return {
    getAnswerSettings: jest.fn().mockResolvedValue({ answerMode: 'automatic', pilotInfo: 'Runway 05/23', closures })
  }
}

describe('getClosures', () => {
  it('returns the closures that have not ended on the aerodrome\'s date, sorted by start', async () => {
    const settings = createSettings([
      { from: '2026-12-24', to: '2026-12-26', reason: 'Christmas' },
      { from: '2026-11-10', to: '2026-11-16', reason: 'Ended' },
      { from: '2026-11-15', to: '2026-11-17', reason: 'Runway works' }
    ])

    expect(await getClosures({ settings }, NOW)).toEqual([
      { from: '2026-11-15', to: '2026-11-17', reason: 'Runway works' },
      { from: '2026-12-24', to: '2026-12-26', reason: 'Christmas' }
    ])
  })

  it('returns only the closures, without the other answer settings', async () => {
    const closures = [{ from: '2026-11-20', to: '2026-11-20', reason: 'Air show' }]
    expect(await getClosures({ settings: createSettings(closures) }, NOW)).toEqual(closures)
  })

  it('leaves out closures that are not valid, as the database may return a list as an object', async () => {
    const settings = createSettings({
      0: { from: '2026-11-20', to: '2026-11-20', reason: ' Air show ' },
      1: { from: '2026-11-21', to: '2026-11-20', reason: 'Ends before it starts' },
      2: { from: '2026-11-22' }
    })

    expect(await getClosures({ settings }, NOW)).toEqual([
      { from: '2026-11-20', to: '2026-11-20', reason: 'Air show' }
    ])
  })

  it('returns none without closures', async () => {
    expect(await getClosures({ settings: createSettings(null) }, NOW)).toEqual([])
  })
})
