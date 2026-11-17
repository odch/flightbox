'use strict'

const { REGISTER_CATEGORIES, CATEGORIES, isHelicopter } = require('./aircraftCategories')
// The app's list, which the functions are deployed without
const appCategories = require('../src/util/aircraftCategoriesData')

describe('aircraftCategories', () => {
  it('has the app\'s categories, in its order', () => {
    expect(CATEGORIES).toEqual(appCategories.map(category => category.name))
  })

  it('has a category for each aircraft type of the register', () => {
    expect(REGISTER_CATEGORIES.Helicopter).toBe('Hubschrauber')
    expect(REGISTER_CATEGORIES.Aeroplane).toBe('Flugzeug')
  })

  it('tells helicopters as the app does', () => {
    const appHelicopters = appCategories.filter(category => category.flightTypeAircraftType === 'helicopter')
      .map(category => category.name)
    expect(CATEGORIES.filter(isHelicopter)).toEqual(appHelicopters)
  })
})
