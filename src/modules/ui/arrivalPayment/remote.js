import firebase from '../../../util/firebase';

export async function create(cardPayment) {
  const cardPaymentsRef = await firebase('/card-payments/')
  const newPaymentRef = await cardPaymentsRef.push(cardPayment)
  return newPaymentRef
}

export async function update(id, cardPayment) {
  const cardPaymentRef = await firebase('/card-payments/' + id)
  await cardPaymentRef.update(cardPayment)
}
