import {AircraftOrigin} from '../landingFees'
import data from './lszo_data.json'
import {isHelicopter} from '../aircraftCategories'

const getLandingFee = (mtow, flightType, aircraftOrigin, aircraftCategory) =>
  getFee(mtow, flightType, aircraftOrigin, aircraftCategory)

const getGoAroundFee = (mtow, flightType, aircraftOrigin, aircraftCategory) =>
  undefined

const getFee = (mtow, flightType, aircraftOrigin, aircraftCategory) => {
  const isHomebase = aircraftOrigin === AircraftOrigin.HOME_BASE || aircraftOrigin === AircraftOrigin.CLUB
  const isInstruction = flightType === 'instruction'
  const isHeli = isHelicopter(aircraftCategory)

  if (isHeli) {
    return getMtowFee(data.fees.helicopter, mtow)
  }

  if (isInstruction) {
    if (isHomebase) {
      return data.fees.instruction_homebase
    }
    return data.fees.instruction_external
  }

  return getMtowFee(data.fees.plane, mtow)
}

const getVatRate = (flightType, aircraftOrigin, aircraftCategory) => {
  const isHomebase = aircraftOrigin === AircraftOrigin.HOME_BASE || aircraftOrigin === AircraftOrigin.CLUB
  const isInstruction = flightType === 'instruction'

  if (isHomebase && isInstruction) {
    return 0
  }

  return 8.1
}

export default {
  getLandingFee,
  getGoAroundFee,
  getVatRate
}
