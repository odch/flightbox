import {takeEvery} from 'redux-saga';
import {call, fork, put, select} from 'redux-saga/effects'
import * as actions from './actions';
import * as remote from './remote'
import createChannel, {monitor} from '../../../util/createChannel'
import {Step} from './reducer'

export const cardPaymentIdSelector = state => state.ui.arrivalPayment.cardPaymentId

export function* createCardPayment(channel, action) {
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

  const values = {
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

function* monitorPaymentStatus(paymentRef, channel) {
  paymentRef.onValueEvent(snapshot => {
    const val = snapshot.val()
    const data = val.data
    const status = val.status

    if (data) {
      paymentRef.off('value')
      window.location.href = data
    } else if (status === 'success') {
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
