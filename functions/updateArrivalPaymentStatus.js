const functions = require('firebase-functions');
const admin = require('firebase-admin');

const instance = functions.config().rtdb.instance;

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
    functions.logger.info(
      `Unable to set arrival payment status for card-payment ${cardPaymentKey}, because arrivalReference is missing`
    );
  }

  try {
    const arrivalSnapshot = await admin.database()
      .ref('arrivals')
      .child(afterValue.arrivalReference)
      .once('value');

    const arrivalValues = arrivalSnapshot.val()

    if (arrivalValues.paymentMethod && arrivalValues.paymentMethod.status === 'pending') {
      functions.logger.info(
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
    functions.logger.error(
      `Failed to update payment status of arrival ${afterValue.arrivalReference}`,
      error
    );
    throw error;
  }
};

exports.updateArrivalPaymentStatusOnCardPaymentUpdate = functions
  .region('europe-west1')
  .database
  .instance(instance)
  .ref('/card-payments/{paymentId}')
  .onWrite(handleUpdate);
