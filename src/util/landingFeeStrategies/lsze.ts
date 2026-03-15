import data from './lsze_data.json'
import {isHelicopter} from '../aircraftCategories'
import {getMtowFee} from './utils'

/**
 * CAUTION: Declared fees in lsze_data.json are INCLUDING VAT.
 */
const getLandingFee = (mtow: number, flightType: string, aircraftOrigin: any, aircraftCategory: string) => {
  const fee = getFee(mtow, flightType, aircraftOrigin, aircraftCategory)
  if (fee) {
    const netFee = fee / (1 + getVatRate(flightType, aircraftOrigin, aircraftCategory) / 100)
    const roundedNetFee = Math.round(netFee * 100) / 100
    return {fee: roundedNetFee}
  }
  return undefined
}

const getGoAroundFee = (mtow: number, flightType: string, aircraftOrigin: any, aircraftCategory: string) =>
  undefined

const getMtowFeeHeavy = (mtow: number) => {
  const tons = Math.ceil(mtow / 1000)
  return tons * 20
}

const getFee = (mtow: number, flightType: string, aircraftOrigin: any, aircraftCategory: string) => {
  if (mtow > 3000) {
    return getMtowFeeHeavy(mtow)
  }

  const isHeli = isHelicopter(aircraftCategory)

  if (isHeli) {
    return getMtowFee(data.fees.helicopter, mtow)
  }

  return getMtowFee(data.fees.plane, mtow)
}

const getVatRate = (flightType: string, aircraftOrigin: any, aircraftCategory: string) => {
  return 8.1
}

export default {
  getLandingFee,
  getGoAroundFee,
  getVatRate
}
