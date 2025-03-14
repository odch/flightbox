import data from './lszm_data.json'
import {AircraftOrigin} from '../landingFees'
import {isHelicopter} from '../aircraftCategories'

const getLandingFee = (mtow, flightType, aircraftOrigin, aircraftCategory) =>
  getFee(mtow, flightType, aircraftOrigin, aircraftCategory)

const getGoAroundFee = (mtow, flightType, aircraftOrigin, aircraftCategory) =>
  undefined

const getFee = (mtow, flightType, aircraftOrigin, aircraftCategory) => {
  const isHomebase = aircraftOrigin === AircraftOrigin.HOME_BASE || aircraftOrigin === AircraftOrigin.CLUB
  const isHeli = isHelicopter(aircraftCategory)
  const isInstruction = flightType === 'instruction'

  const factor = getFactor(isHomebase, isHeli, isInstruction)
  const baseFee = getBaseFee(mtow)

  const fee = round1Decimal(baseFee * factor)

  return {fee};
}

const getFactor = (isHomebase, isHeli, isInstruction) => {
  const factorName = getFactorName(isHomebase, isHeli, isInstruction)
  return data.factors[factorName]
}

const getFactorName = (isHomebase, isHeli, isInstruction) => {
  if (!isHomebase) {
    return 'non_homebase_plane_helicopter'
  }
  if (isHeli) {
    return 'homebase_helicopter'
  }
  if (isInstruction) {
    return 'homebase_plane_instruction'
  }
  return 'homebase_plane'
}

const getBaseFee = mtow => {
  for (const entry of data.fees.base) {
    if (mtow <= entry.max_weight) {
      return entry.fee
    }
  }
}

const round1Decimal = val => Math.round(val * 10) / 10;

export default {
  getLandingFee,
  getGoAroundFee
}
