const { onValueWritten } = require('firebase-functions/v2/database');
const { logger } = require('firebase-functions/v2');
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');

const RTDB_INSTANCE = defineString('RTDB_INSTANCE');
const RTDB_REGION = defineString('RTDB_REGION', { default: 'europe-west1' });

const handleUpdate = async (change) => {
  if (!change.before.exists() || !change.after.exists()) {
    return null;
  }

  const cardPaymentKey = change.after.ref.key;
  const beforeValue = change.before.val();
  const afterValue = change.after.val();

  const wasSetToSuccess = beforeValue.status !== afterValue.status && afterValue.status === 'success';

  if (!wasSetToSuccess) {
    return
  }

  if (!afterValue.arrivalReference) {
    logger.info(
      `Unable to set arrival payment status for card-payment ${cardPaymentKey}, because arrivalReference is missing`
    );
    return
  }

  try {
    const arrivalSnapshot = await admin.database()
      .ref('arrivals')
      .child(afterValue.arrivalReference)
      .once('value');

    const arrivalValues = arrivalSnapshot.val()

    if (!arrivalValues) {
      logger.info(
        `Unable to set arrival payment status for card-payment ${cardPaymentKey}, because arrival ${afterValue.arrivalReference} does not exist`
      );
      return
    }

    if (arrivalValues.paymentMethod && arrivalValues.paymentMethod.status === 'pending') {
      logger.info(
        `Setting payment status of arrival ${afterValue.arrivalReference} to completed (card payment ${cardPaymentKey})`
      );

      await admin.database()
        .ref('arrivals')
        .child(afterValue.arrivalReference)
        .update({
          paymentMethod: {
            ...arrivalValues.paymentMethod,
            status: 'completed'
          }
        });
    }
  } catch (error) {
    logger.error(
      `Failed to update payment status of arrival ${afterValue.arrivalReference}`,
      error
    );
    throw error;
  }
};

const instanceOpt = `{{ params.${RTDB_INSTANCE.name} }}`;
const regionOpt = `{{ params.${RTDB_REGION.name} }}`;

exports.updateArrivalPaymentStatusOnCardPaymentUpdate = onValueWritten(
  { region: regionOpt, instance: instanceOpt, ref: '/card-payments/{paymentId}' },
  event => handleUpdate(event.data)
);
