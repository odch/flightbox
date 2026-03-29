import {AircraftOrigin} from '../landingFees'
import data from './lspl_data.json'
import {isHelicopter} from '../aircraftCategories'
import {getMtowFee} from './utils'

const getLandingFee = (mtow: number, flightType: string, aircraftOrigin: any, aircraftCategory: string) => {
  const fee = getFee(mtow, flightType, aircraftOrigin, aircraftCategory)
  if (fee) {
    return {fee}
  }
  return undefined
}

const getGoAroundFee = (mtow: number, flightType: string, aircraftOrigin: any, aircraftCategory: string) =>
  undefined

const getFee = (mtow: number, flightType: string, aircraftOrigin: any, aircraftCategory: string) => {
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

const getVatRate = (flightType: string, aircraftOrigin: any, aircraftCategory: string) => {
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
