const { onValueCreated, onValueWritten } = require('firebase-functions/v2/database');
const { logger } = require('firebase-functions/v2');
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');

const RTDB_INSTANCE = defineString('RTDB_INSTANCE');
const RTDB_REGION = defineString('RTDB_REGION', { default: 'europe-west1' });

const instanceOpt = `{{ params.${RTDB_INSTANCE.name} }}`;
const regionOpt = `{{ params.${RTDB_REGION.name} }}`;

const getEnrichedData = (aerodromeSnapshot, icaoCode) => {
  if (!aerodromeSnapshot.exists()) {
    logger.warn(`Aerodrome data not found for ICAO code: ${icaoCode}. Clearing enriched data.`);
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
    logger.warn(`No location found for ${movementType} ${movementKey}`);
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
      const movementRef = admin.database().ref(movementPath).child(movementKey);
      const currentSnapshot = await movementRef.once('value');
      if (!currentSnapshot.exists()) {
        logger.info(
          `${movementType} ${movementKey} no longer exists, skipping enrichment`
        );
        return;
      }
      await movementRef.update(enrichedData);

      logger.info(
        `Enriched ${movementType} ${movementKey} with aerodrome metadata for ${icaoCode}: ${enrichedData.locationName}, ${enrichedData.country}`
      );
    }

  } catch (error) {
    logger.error(
      `Failed to enrich ${movementType} ${movementKey} with aerodrome metadata:`,
      error
    );
    throw error;
  }
}

async function enrichOnCreate(snapshot, movementType) {
  const movementKey = snapshot.ref.key;
  const movement = snapshot.val();

  logger.info(`Enriching new ${movementType} ${movementKey} with aerodrome metadata`);

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
    logger.info(
      `Enriching updated ${movementType} ${movementKey} (location changed: ${locationChanged}, missing metadata: ${missingMetadata})`
    );

    await enrichMovementWithAerodromeMetadata(afterMovement, movementType, movementKey);
  }
}

const handleUpdate = (change, movementType) => {
  if (!change.before.exists() || !change.after.exists()) {
    return null;
  }
  // Skip anonymized movements (PII has been stripped by the retention job)
  if (change.after.val().anonymized) {
    return null;
  }
  return enrichOnUpdate(change, movementType);
};

exports.enrichDepartureOnCreate = onValueCreated(
  { region: regionOpt, instance: instanceOpt, ref: '/departures/{departureId}' },
  event => enrichOnCreate(event.data, 'departure')
);

exports.enrichDepartureOnUpdate = onValueWritten(
  { region: regionOpt, instance: instanceOpt, ref: '/departures/{departureId}' },
  event => handleUpdate(event.data, 'departure')
);

exports.enrichArrivalOnCreate = onValueCreated(
  { region: regionOpt, instance: instanceOpt, ref: '/arrivals/{arrivalId}' },
  event => enrichOnCreate(event.data, 'arrival')
);

exports.enrichArrivalOnUpdate = onValueWritten(
  { region: regionOpt, instance: instanceOpt, ref: '/arrivals/{arrivalId}' },
  event => handleUpdate(event.data, 'arrival')
);
