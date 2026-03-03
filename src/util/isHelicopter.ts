import {isHelicopter as isHelicopterCategory} from './aircraftCategories'

const isHelicopter = (registration: string, aircraftCategory?: string): boolean =>
  !aircraftCategory
    ? /HB[XZ].*/.test(registration)  // deprecated heuristic derived from registration
    : isHelicopterCategory(aircraftCategory)

export default isHelicopter
