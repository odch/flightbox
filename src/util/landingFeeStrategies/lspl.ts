import {AircraftOrigin} from '../landingFees'
import data from './lspl_data.json'
import {getMtowFee} from './utils'

const BALLOON_CATEGORIES = ['Ballon (Heissluft)', 'Ballon (Gas)', 'Luftschiff (Heissluft)']
const GLIDER_AEROTOW_RE = /^glider_(instruction|private)_aerotow$/

const isBalloon = (aircraftCategory: string) => BALLOON_CATEGORIES.includes(aircraftCategory)
const isAerotowTug = (flightType: string) => flightType === 'aerotow'
const isAerotowedGlider = (flightType: string) => GLIDER_AEROTOW_RE.test(flightType)
const isHomebaseOrigin = (aircraftOrigin: any) =>
  aircraftOrigin === AircraftOrigin.HOME_BASE || aircraftOrigin === AircraftOrigin.CLUB

const getLandingFee = (mtow: number, flightType: string, aircraftOrigin: any, aircraftCategory: string) => {
  const fee = getFee(mtow, flightType, aircraftOrigin, aircraftCategory)
  if (typeof fee === 'number') {
    return {fee}
  }
  return undefined
}

const getGoAroundFee = (mtow: number, flightType: string, aircraftOrigin: any, aircraftCategory: string) =>
  undefined

const getFee = (mtow: number, flightType: string, aircraftOrigin: any, aircraftCategory: string) => {
  if (isBalloon(aircraftCategory)) {
    return data.fees.balloon
  }

  if (isAerotowTug(flightType)) {
    return data.fees.aerotow
  }

  if (isAerotowedGlider(flightType)) {
    return undefined
  }

  if (isHomebaseOrigin(aircraftOrigin)) {
    return data.fees.plane_homebase
  }

  return getMtowFee(data.fees.plane, mtow)
}

const getVatRate = (flightType: string, aircraftOrigin: any, aircraftCategory: string) => {
  if (isBalloon(aircraftCategory)) {
    return 8.1
  }

  if (isAerotowTug(flightType) || isAerotowedGlider(flightType)) {
    return 0
  }

  if (isHomebaseOrigin(aircraftOrigin)) {
    return 0
  }

  return 8.1
}

export default {
  getLandingFee,
  getGoAroundFee,
  getVatRate
}
