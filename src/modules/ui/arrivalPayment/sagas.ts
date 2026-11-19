import {all, call, fork, put, select, takeEvery} from 'redux-saga/effects'
import {onValue} from 'firebase/database'
import * as actions from './actions';
import * as remote from './remote'
import createChannel, {monitor} from '../../../util/createChannel'
import {Step} from './reducer'
import {hasPendingMovementWrites, movementWritesSettled} from '../../movements/remoteApi'

export const cardPaymentIdSelector = (state: any) => state.ui.arrivalPayment.cardPaymentId;

export const authUidSelector = (state: any) => state.auth && state.auth.data && state.auth.data.uid;

export function* createCardPayment(channel: any, action: any) {
  const {
    amount,
    currency,
    movementKey,
    refNr,
    method,
    email,
    immatriculation,
    landings,
    landingFeeSingle,
    landingFeeCode,
    landingFeeTotal,
    goArounds,
    goAroundFeeSingle,
    goAroundFeeCode,
    goAroundFeeTotal
  } = action.payload

  // Stamp the payment with its creator so access can be scoped to the owner
  // (see the card-payment rules). Owner-scoped projects require owner === the
  // caller's uid on create; unscoped projects ignore it.
  const owner = yield select(authUidSelector)

  const values: Record<string, unknown> = {
    amount: Math.round(amount * 100),
    currency,
    method,
    email,
    immatriculation,
    landings,
    landingFeeSingle,
    landingFeeTotal,
    refNr,
    arrivalReference: movementKey,
    status: 'pending',
    timestamp: new Date().getTime()
  }
  if (owner) {
    values.owner = owner
  }
  if (landingFeeCode) {
    values.landingFeeCode = landingFeeCode
  }
  if (goArounds && goAroundFeeTotal) {
    values.goArounds = goArounds
    values.goAroundFeeSingle = goAroundFeeSingle
    values.goAroundFeeCode = goAroundFeeCode
    values.goAroundFeeTotal = goAroundFeeTotal
  }
  const newPaymentRef = yield call(remote.create, values)
  yield put(actions.setCardPaymentId(newPaymentRef.key))
  yield call(monitorPaymentStatus, newPaymentRef, channel)
}

// With movementWritesViaApi the payment method of the arrival is saved with
// a fetch that may not have been sent yet when the checkout URL arrives;
// leaving the page would cancel it and the paid arrival would never be
// marked completed (functions/updateArrivalPaymentStatus.js). Without
// pending API writes (always the case with the database) redirect at once.
export function redirectToCheckout(url: string) {
  if (!hasPendingMovementWrites()) {
    window.location.href = url
    return
  }
  movementWritesSettled().then(() => {
    window.location.href = url
  })
}

export function* monitorPaymentStatus(paymentRef: any, channel: any) {
  const unsubscribe = onValue(paymentRef, (snapshot: any) => {
    const val = snapshot.val()
    const data = val.data
    const status = val.status

    if (data) {
      unsubscribe()
      redirectToCheckout(data)
    } else if (status === 'success') {
      channel.put(actions.setStep(Step.COMPLETED))
      unsubscribe()
    } else if (status === 'failure') {
      channel.put(actions.setMethod(null))
      channel.put(actions.cardPaymentFailure())
      channel.put(actions.setStep(Step.OPTIONS))
      unsubscribe()
    } else if (status === 'cancelled') {
      channel.put(actions.setMethod(null))
      channel.put(actions.setStep(Step.OPTIONS))
      unsubscribe()
    }
  })
}

export function* cancelCardPayment() {
  const cardPaymentId = yield select(cardPaymentIdSelector)

  if (!cardPaymentId) {
    return
  }

  yield call(remote.update, cardPaymentId, {
    status: 'cancelled'
  })
}

export default function* sagas() {
  const paymentStatusChannel = createChannel()
  yield all([
    fork(monitor, paymentStatusChannel),
    takeEvery(actions.ARRIVAL_PAYMENT_CREATE_CARD_PAYMENT, createCardPayment, paymentStatusChannel),
    takeEvery(actions.ARRIVAL_PAYMENT_CANCEL_CARD_PAYMENT, cancelCardPayment)
  ])
}
