
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

const getAssociations = movements => {
  const movementsPerAircraft = getMovementsPerAircraft(movements);

  const associations = {};

  for (const immatriculation in movementsPerAircraft) {
    if (movementsPerAircraft.hasOwnProperty(immatriculation)) {
      const aircraftMovements = movementsPerAircraft[immatriculation];

      let currentMovementKey = null;

      for (let i = 0; i < aircraftMovements.length; i++) {
        const movement = aircraftMovements[i];

        const preceding = i < aircraftMovements.length - 1 ? aircraftMovements[i + 1] : null;

        associations[movement.key] = {
          preceding: preceding ? preceding.key : null,
          subsequent: currentMovementKey
        };

        currentMovementKey = movement.key;
      }
    }
  }

  return associations;
};

const associate = (movements, comparator) => {
  const associations = getAssociations(movements.array);

  const updatedMovements = [];

  for (let i = 0; i < movements.array.length; i++) {
    const movement = movements.array[i];

    const newMovementAssociations = associations[movement.key];

    if (!movement.associations
      || movement.associations.preceding !== newMovementAssociations.preceding
      || movement.associations.subsequent !== newMovementAssociations.subsequent) {

      const updatedMovement = Object.assign({}, movement, {
        associations: newMovementAssociations
      });
      updatedMovements.push(updatedMovement);
    }
  }

  let newMovementsArray = movements;

  updatedMovements.forEach(movement => {
    newMovementsArray = newMovementsArray.update(movement, comparator)
  });

  return newMovementsArray;
};

export default associate;
