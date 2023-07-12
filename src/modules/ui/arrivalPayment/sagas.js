import { takeEvery } from 'redux-saga';
import { fork, call } from 'redux-saga/effects'
import * as actions from './actions';
import * as remote from './remote'
import createChannel, {monitor} from '../../../util/createChannel'
import {Step} from './reducer'

export function* createCardPayment(channel, action) {
  const {amount, currency, movementKey} = action.payload
  const values = {
    amount,
    currency,
    arrivalReference: movementKey,
    status: 'pending',
    timestamp: new Date().getTime()
  }
  const newPaymentRef = yield call(remote.save, values)
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
    }
  })
}

export default function* sagas() {
  const paymentStatusChannel = createChannel()
  yield [
    fork(monitor, paymentStatusChannel),
    fork(takeEvery, actions.ARRIVAL_PAYMENT_CREATE_CARD_PAYMENT, createCardPayment, paymentStatusChannel)
  ]
}
