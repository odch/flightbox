import data from './lszi_data.json'
import {isHelicopter, flightTypeAircraftType} from '../aircraftCategories'
import {getMtowFee} from './utils'

/**
 * Fee schedule of Flugplatz Fricktal-Schupfart (LSZI), per
 * https://www.aecs-fricktal.ch/tanken_taxen:
 *   - bis 600 kg MTOM inkl. alle Segelflugzeuge: CHF 13.-
 *   - 601 kg bis 1100 kg MTOM:                   CHF 19.-
 *   - ab 1101 kg MTOM inkl. Helikopter:          CHF 25.-
 * All gliders are billed at the lowest rate regardless of weight,
 * all helicopters at the highest rate. No VAT is declared.
 */
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
  if (isHelicopter(aircraftCategory)) {
    return data.fees.helicopter
  }

  if (flightTypeAircraftType(aircraftCategory) === 'glider') {
    return data.fees.glider
  }

  return getMtowFee(data.fees.plane, mtow)
}

const getVatRate = (flightType: string, aircraftOrigin: any, aircraftCategory: string) =>
  0

export default {
  getLandingFee,
  getGoAroundFee,
  getVatRate
}
