import {isHelicopter as isHelicopterCategory} from './aircraftCategories'

const isHelicopter = (registration, aircraftCategory) =>
  !aircraftCategory
    ? /HB[XZ].*/.test(registration)  // deprecated heuristic derived from registration
    : isHelicopterCategory(aircraftCategory)

export default isHelicopter
