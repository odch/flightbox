import firebase from '../../../util/firebase';

export async function save(cardPayment) {
  const cardPaymentsRef = await firebase('/card-payments/')
  const newPaymentRef = await cardPaymentsRef.push(cardPayment)
  return newPaymentRef
}
