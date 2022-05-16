
const getMovementsPerAircraft = movements => {
  const movementsPerAircraft = {};

  movements.forEach(movement => {
    let aircraftMovements = movementsPerAircraft[movement.immatriculation];

    if (!aircraftMovements) {
      aircraftMovements = [];
      movementsPerAircraft[movement.immatriculation] = aircraftMovements;
    }

    aircraftMovements.push(movement);
  });

  return movementsPerAircraft;
};

const getAssociations = (movements, homeBaseAircrafts) => {
  const movementsPerAircraft = getMovementsPerAircraft(movements);

  const associations = {};

  for (const immatriculation in movementsPerAircraft) {
    if (movementsPerAircraft.hasOwnProperty(immatriculation)) {
      const isHomeBase = homeBaseAircrafts.has(immatriculation);
      const aircraftMovements = movementsPerAircraft[immatriculation];

      let currentMovement = null;

      for (let i = 0; i < aircraftMovements.length; i++) {
        const movement = aircraftMovements[i];
        const preceding = i < aircraftMovements.length - 1 ? aircraftMovements[i + 1] : null;
        associations[movement.key] = getAssociatedMovement(movement, isHomeBase, preceding, currentMovement);
        currentMovement = movement;
      }
    }
  }

  return associations;
};

const shouldBeCircuits = movement => {
  const route = movement.departureRoute || movement.arrivalRoute;
  return route === 'circuits';
}

const hasValidRoute = (movement, expectCircuits) => {
  const route = movement.departureRoute || movement.arrivalRoute;
  return expectCircuits && route === 'circuits' || !expectCircuits && route !== 'circuits';
}

const ifType = (movement, expectedType, expectCircuits) => {
  if (movement) {
    if (movement.type === expectedType && hasValidRoute(movement, expectCircuits)) {
      return movement;
    }
    return null; // movement missing in database for sure (no need to try to find it)
  }
  return undefined; // movement could be in the database, but not yet loaded
}

/**
 * return null if wrong
 */
export const getAssociatedMovement = (movement, isHomeBase, preceding, subsequent) => {
  const expectCircuits = shouldBeCircuits(movement);
  if (movement.type === 'departure') {
    if (isHomeBase) {
      return ifType(subsequent, 'arrival', expectCircuits);
    } else {
      return ifType(preceding, 'arrival', expectCircuits);
    }
  } else if (movement.type === 'arrival') {
    if (isHomeBase) {
      return ifType(preceding, 'departure', expectCircuits);
    } else {
      return ifType(subsequent, 'departure', expectCircuits);
    }
  }
  throw new Error('Code should not be reached');
}

export default getAssociations;
