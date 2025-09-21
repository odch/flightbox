import data from './lszm_data.json'
import {AircraftOrigin} from '../landingFees'
import {flightTypeAircraftType, isHelicopter} from '../aircraftCategories'
import {getMtowFee} from './utils'

const getLandingFee = (mtow, flightType, aircraftOrigin, aircraftCategory) =>
  getFee(mtow, flightType, aircraftOrigin, aircraftCategory)

const getGoAroundFee = (mtow, flightType, aircraftOrigin, aircraftCategory) =>
  undefined

const getFee = (mtow, flightType, aircraftOrigin, aircraftCategory) => {
  const isHomebase = aircraftOrigin === AircraftOrigin.HOME_BASE || aircraftOrigin === AircraftOrigin.CLUB

  if (flightTypeAircraftType(aircraftCategory) === 'glider') {
    return getGliderFee(flightType, isHomebase)
  }

  const isHeli = isHelicopter(aircraftCategory)
  const isInstruction = flightType === 'instruction'

  const factorName = getFactorName(isHomebase, isHeli, isInstruction)
  const fee = getMtowFee(data.fees[factorName], mtow)

  return {fee};
}

const getVat = (isHomebase, isHeli, isInstruction) => {
  const factorName = getFactorName(isHomebase, isHeli, isInstruction)
  return data.vat[factorName]
}

const getVatRate = (flightType, aircraftOrigin, aircraftCategory) => {
  const isHomebase = aircraftOrigin === AircraftOrigin.HOME_BASE || aircraftOrigin === AircraftOrigin.CLUB

  if (flightTypeAircraftType(aircraftCategory) === 'glider') {
    return getGliderVatRate(flightType, isHomebase)
  }

  const isHeli = isHelicopter(aircraftCategory)
  const isInstruction = flightType === 'instruction'

  return getVat(isHomebase, isHeli, isInstruction)
}

const getGliderVatRate = (flightType, isHomebase) => {
  const match = flightType.match(/^glider_(instruction|private)_(self|winch|aerotow)$/)
  if (!match) {
    throw new Error('Unsupported flight type ' + flightType)
  }
  const instructionPrivateType = match[1]
  const gliderBaseName = match[2]

  const isInstruction = instructionPrivateType === 'instruction'

  return gliderBaseName === 'winch' && !isHomebase
    ? getVat(true, false, false) // same factor as homebase (non-instruction) for non-homebase if winch
    : getVat(isHomebase, false, isInstruction)
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

const getGliderFactorName = (isHomebase, method, isInstruction) => {
  let factorName = isHomebase ? 'homebase' : 'non_homebase'

  factorName += `_${method}`

  if (isHomebase && isInstruction) {
    factorName += '_instruction'
  }

  return factorName
}

const getGliderFee = (flightType, isHomebase) => {
  const match = flightType.match(/^glider_(instruction|private)_(self|winch|aerotow)$/)
  if (!match) {
    throw new Error('Unsupported flight type ' + flightType)
  }
  const instructionPrivateType = match[1]
  const method = match[2]

  const factorName = getGliderFactorName(isHomebase, method, instructionPrivateType === 'instruction')

  if (!factorName) {
    return undefined
  }

  const fee = data.fees.glider[factorName]

  if (typeof fee !== 'number') {
    return undefined
  }

  return {fee}
}

export default {
  getLandingFee,
  getGoAroundFee,
  getVatRate
}
