import { takeEvery } from 'redux-saga';
import { fork, call, select, put } from 'redux-saga/effects'
import * as actions from './actions';
import * as remote from './remote'
import createChannel, {monitor} from '../../../util/createChannel'
import {Step} from './reducer'

export const cardPaymentIdSelector = state => state.ui.arrivalPayment.cardPaymentId

export function* createCardPayment(channel, action) {
  const {amount, currency, movementKey} = action.payload
  const values = {
    amount,
    currency,
    arrivalReference: movementKey,
    status: 'pending',
    timestamp: new Date().getTime()
  }
  const newPaymentRef = yield call(remote.create, values)
  yield put(actions.setCardPaymentId(newPaymentRef.key))
  yield call(monitorPaymentStatus, newPaymentRef, channel)
}

function* monitorPaymentStatus(paymentRef, channel) {
  paymentRef.onValueEvent(snapshot => {
    const status = snapshot.val().status
    if (status === 'success') {
      channel.put(actions.setStep(Step.COMPLETED))
      paymentRef.off('value')
    } else if (status === 'failure') {
      channel.put(actions.setMethod(null))
      channel.put(actions.cardPaymentFailure())
      channel.put(actions.setStep(Step.OPTIONS))
      paymentRef.off('value')
    } else if (status === 'cancelled') {
      channel.put(actions.setMethod(null))
      channel.put(actions.setStep(Step.OPTIONS))
      paymentRef.off('value')
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
  yield [
    fork(monitor, paymentStatusChannel),
    fork(takeEvery, actions.ARRIVAL_PAYMENT_CREATE_CARD_PAYMENT, createCardPayment, paymentStatusChannel),
    fork(takeEvery, actions.ARRIVAL_PAYMENT_CANCEL_CARD_PAYMENT, cancelCardPayment, paymentStatusChannel)
  ]
}
