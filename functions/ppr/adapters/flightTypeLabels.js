'use strict'

// German flight type labels for the new-request email to the aerodrome.
// Ports the flightTypes labels from src/locales/de.json (functions are
// deployed without the client sources); parity with the client is enforced
// by flightTypeLabels.spec.js.
const FLIGHT_TYPE_LABELS_DE = Object.freeze({
  private: 'Privat',
  commercial: 'Gewerblich',
  instruction: 'Schulung',
  aerotow: 'Flugzeugschlepp',
  paradrop: 'Paradrop',
  glider_private_aerotow: 'Privat (Schlepp)',
  glider_private_winch: 'Privat (Winde)',
  glider_private_self: 'Privat (Selbststart)',
  glider_instruction_aerotow: 'Schulung (Schlepp)',
  glider_instruction_winch: 'Schulung (Winde)',
  glider_instruction_self: 'Schulung (Selbststart)',
  military: 'Militär',
  sar: 'Such- und Rettungsflüge SAR'
})

// Unknown values (e.g. a flight type added later) are shown as they are.
function flightTypeLabel(flightType) {
  return Object.prototype.hasOwnProperty.call(FLIGHT_TYPE_LABELS_DE, flightType)
    ? FLIGHT_TYPE_LABELS_DE[flightType]
    : flightType
}

module.exports = {
  FLIGHT_TYPE_LABELS_DE,
  flightTypeLabel
}
