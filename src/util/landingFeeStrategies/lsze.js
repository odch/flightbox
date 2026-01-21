import data from './lsze_data.json'
import {isHelicopter} from '../aircraftCategories'
import {getMtowFee} from './utils'

/**
 * CAUTION: Declared fees in lsze_data.json are INCLUDING VAT.
 */
const getLandingFee = (mtow, flightType, aircraftOrigin, aircraftCategory) => {
  const fee = getFee(mtow, flightType, aircraftOrigin, aircraftCategory)
  if (fee) {
    const netFee = fee / (1 + getVatRate(flightType, aircraftOrigin, aircraftCategory) / 100)
    const roundedNetFee = Math.round(netFee * 100) / 100
    return {fee: roundedNetFee}
  }
  return undefined
}

const getGoAroundFee = (mtow, flightType, aircraftOrigin, aircraftCategory) =>
  undefined

const getMtowFeeHeavy = mtow => {
  const tons = Math.ceil(mtow / 1000)
  return tons * 20
}

const getFee = (mtow, flightType, aircraftOrigin, aircraftCategory) => {
  if (mtow > 3000) {
    return getMtowFeeHeavy(mtow)
  }

  const isHeli = isHelicopter(aircraftCategory)

  if (isHeli) {
    return getMtowFee(data.fees.helicopter, mtow)
  }

  return getMtowFee(data.fees.plane, mtow)
}

const getVatRate = (flightType, aircraftOrigin, aircraftCategory) => {
  return 8.1
}

export default {
  getLandingFee,
  getGoAroundFee,
  getVatRate
}
