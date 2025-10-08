const functions = require('firebase-functions');
const admin = require('firebase-admin');

const getEnrichedData = (aerodromeSnapshot, icaoCode) => {
  if (!aerodromeSnapshot.exists()) {
    functions.logger.warn(`Aerodrome data not found for ICAO code: ${icaoCode}. Clearing enriched data.`);
    return {
      locationName: null,
      locationCountry: null,
      locationTimezone: null
    };
  }

  const aerodromeData = aerodromeSnapshot.val();
  return {
    locationName: aerodromeData.name || null,
    locationCountry: aerodromeData.country || null,
    locationTimezone: aerodromeData.timezone || null,
  };
}

async function enrichMovementWithAerodromeMetadata(movement, movementType, movementKey) {
  if (!movement?.location) {
    functions.logger.warn(`No location found for ${movementType} ${movementKey}`);
    return;
  }

  const icaoCode = movement.location.toUpperCase();

  try {
    const aerodromeSnapshot = await admin.database()
      .ref('aerodromes')
      .child(icaoCode)
      .once('value');

    const enrichedData = getEnrichedData(aerodromeSnapshot, icaoCode)

    const hasChanges = movement.locationName !== enrichedData.locationName ||
                      movement.locationCountry !== enrichedData.locationCountry ||
                      movement.locationTimezone !== enrichedData.locationTimezone;

    if (hasChanges) {
      const movementPath = movementType === 'departure' ? 'departures' : 'arrivals';
      await admin.database()
        .ref(movementPath)
        .child(movementKey)
        .update(enrichedData);

      functions.logger.info(
        `Enriched ${movementType} ${movementKey} with aerodrome metadata for ${icaoCode}: ${enrichedData.locationName}, ${enrichedData.country}`
      );
    }

  } catch (error) {
    functions.logger.error(
      `Failed to enrich ${movementType} ${movementKey} with aerodrome metadata:`,
      error
    );
    throw error;
  }
}

async function enrichOnCreate(snapshot, movementType) {
  const movementKey = snapshot.ref.key;
  const movement = snapshot.val();

  functions.logger.info(`Enriching new ${movementType} ${movementKey} with aerodrome metadata`);

  await enrichMovementWithAerodromeMetadata(movement, movementType, movementKey);
}

async function enrichOnUpdate(change, movementType) {
  const movementKey = change.after.ref.key;
  const beforeMovement = change.before.val();
  const afterMovement = change.after.val();

  const locationChanged = beforeMovement.location !== afterMovement.location;
  const missingMetadata = !afterMovement.locationName ||
                         !afterMovement.locationCountry ||
                         !afterMovement.locationTimezone;

  if (locationChanged || missingMetadata) {
    functions.logger.info(
      `Enriching updated ${movementType} ${movementKey} (location changed: ${locationChanged}, missing metadata: ${missingMetadata})`
    );

    await enrichMovementWithAerodromeMetadata(afterMovement, movementType, movementKey);
  }
}

const instance = functions.config().rtdb.instance;

const handleUpdate = (change, movementType) => {
  if (!change.before.exists() || !change.after.exists()) {
    return null;
  }
  return enrichOnUpdate(change, movementType);
};

exports.enrichDepartureOnCreate = functions.database
  .instance(instance)
  .ref('/departures/{departureId}')
  .onCreate((snapshot) => enrichOnCreate(snapshot, 'departure'));

exports.enrichDepartureOnUpdate = functions.database
  .instance(instance)
  .ref('/departures/{departureId}')
  .onWrite((change) => handleUpdate(change, 'departure'));

exports.enrichArrivalOnCreate = functions.database
  .instance(instance)
  .ref('/arrivals/{arrivalId}')
  .onCreate((snapshot) => enrichOnCreate(snapshot, 'arrival'));

exports.enrichArrivalOnUpdate = functions.database
  .instance(instance)
  .ref('/arrivals/{arrivalId}')
  .onWrite((change) => handleUpdate(change, 'arrival'));
