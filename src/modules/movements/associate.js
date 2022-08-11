
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

  let associations = {};

  for (const immatriculation in movementsPerAircraft) {
    if (movementsPerAircraft.hasOwnProperty(immatriculation)) {
      const isHomeBase = homeBaseAircrafts.has(immatriculation);
      const aircraftMovements = movementsPerAircraft[immatriculation];

      const aircraftAssociations = getAircraftAssociations(aircraftMovements, isHomeBase);
      associations = {
        ...associations,
        ...aircraftAssociations
      }
    }
  }

  return associations;
};

const getAircraftAssociations = (aircraftMovements, isHomeBase) => {
  const associations = {};

  addAssociatedMovement(aircraftMovements, isCircuit, associations, isHomeBase);
  addAssociatedMovement(aircraftMovements, movement => !isCircuit(movement), associations, isHomeBase);

  return associations;
}

const addAssociatedMovement = (aircraftMovements, predicate, associations, isHomeBase) => {
  const relevantMovements = aircraftMovements.filter(predicate);
  relevantMovements.forEach(movement => {
    associations[movement.key] = getAssociatedMovement(movement, isHomeBase, relevantMovements);
  })
}

const isCircuit = movement => {
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
export const getAssociatedMovement = (movement, isHomeBase, aircraftMovements) => {
  const expectCircuits = isCircuit(movement);

  const index = aircraftMovements.findIndex(m => m.key === movement.key);

  const preceding = aircraftMovements[index + 1];
  const subsequent = aircraftMovements[index - 1];

  if (expectCircuits) {
    if (movement.type === 'departure') {
      return ifType(subsequent, 'arrival', expectCircuits);
    } else if (movement.type === 'arrival') {
      return ifType(preceding, 'departure', expectCircuits);
    }
  } else {
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
  }

  throw new Error('Code should not be reached');
}

export default getAssociations;
