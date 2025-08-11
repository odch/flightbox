import React, {Component} from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {Step} from '../../../../modules/ui/arrivalPayment'
import SingleSelect from '../../../SingleSelect'
import {CancelButton, NextButton} from '../../../WizardNavigation'
import CashPaymentMessage from './CashPaymentMessage'
import FinishActions from './FinishActions'
import TwintPaymentMessage from './TwintPaymentMessage'
import {withRouter} from 'react-router-dom'
import {getFromItemKey} from '../../../../util/reference-number'
import {PAYMENT_METHODS} from '../../../../util/paymentMethods'

const Container = styled.div`
`

const SelectContainer = styled.div`
  width: 400px;
  max-width: 100%;
  margin: auto;
  font-size: 1.5em;
`

const InstructionMessage = styled.div`
  font-size: 1.2em;
  margin: 1em;
`

const SuccessMessage = styled.div`
  font-size: 1.5em;
  margin: 0 auto 3em auto;
  max-width: 800px;
  padding: 1em;
  background-color: #bddda9;
  border-radius: 10px;
`

const FailureMessage = styled(InstructionMessage)`
  color: ${props => props.theme.colors.danger};
`

const StyledNextButton = styled(NextButton)`
  margin-top: 1em;
  margin-bottom: 1em;
`

const StyledCancelButton = styled(CancelButton)`
  margin-top: 1em;
  margin-bottom: 1em;
`

class PaymentMethod extends Component {

  constructor(props) {
    super(props)
    this.confirmMethod = this.confirmMethod.bind(this);
  }

  componentWillMount() {
    // set to completed if success message from online checkout
    const query = new URLSearchParams(this.props.location.search)
    const successParam = query.get('success')
    if (successParam === 'true') {
      this.props.setMethod('checkout')
      this.props.setStep(Step.COMPLETED)
      return
    }

    // continue with only enabled payment method if only one
    if (this.props.enabledPaymentMethods.length === 1) {
      const method = this.props.enabledPaymentMethods[0]
      this.props.setMethod(method)
      this.confirmMethod(method)
    }
  }

  confirmMethod(method) {
    if (!method) {
      return
    }

    const {
      itemKey,
      invoiceRecipientName,
      email,
      immatriculation,
      amount,
      landings,
      landingFeeSingle,
      landingFeeCode,
      landingFeeTotal,
      goArounds,
      goAroundFeeSingle,
      goAroundFeeCode,
      goAroundFeeTotal,
      createCardPayment,
      setStep,
      saveMovementPaymentMethod
    } = this.props

    const paymentMethodData = {
      method
    }

    if (['cash', 'twint_external'].includes(method)) {
      setStep(Step.COMPLETED)
    } else if (method === 'invoice') {
      paymentMethodData.invoiceRecipientName = invoiceRecipientName
      setStep(Step.COMPLETED)
    } else if (method === 'card') {
      setStep(Step.CONFIRMED)
      createCardPayment(
        itemKey,
        getFromItemKey(itemKey),
        amount,
        'CHF',
        'card',
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
      )
    } else if (method === 'checkout') {
      setStep(Step.CONFIRMED)
      createCardPayment(
        itemKey,
        getFromItemKey(itemKey),
        amount,
        'CHF',
        'checkout',
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
      )
    }

    saveMovementPaymentMethod('arrival', itemKey, paymentMethodData)
  }

  render() {
    const {
      itemKey,
      method,
      step,
      failure,
      createMovementFromMovement,
      finish,
      setMethod,
      cancelCardPayment,
      enabledPaymentMethods,
      invoiceRecipientName
    } = this.props

    return (
      <Container>
        {failure && (
          <FailureMessage>Die Zahlung ist fehlgeschlagen. Bitte versuchen Sie es erneut.</FailureMessage>
        )}
        {step === Step.COMPLETED ? (
          <>
            {method === 'cash' ? (
              <CashPaymentMessage itemKey={itemKey}/>
            ) : method === 'twint_external' ? (
              <TwintPaymentMessage itemKey={itemKey}/>
            ) : method === 'checkout' ? (
              <SuccessMessage>Die Zahlung war erfolgreich</SuccessMessage>
            ) : null}
            <FinishActions itemKey={itemKey}
                           createMovementFromMovement={createMovementFromMovement}
                           finish={finish}/>
          </>
        ) : step === Step.CONFIRMED ? (
          method === 'card' ? (
            <>
              <InstructionMessage>Bitte folgen Sie den Anweisungen auf dem Kartenlesegerät</InstructionMessage>
              <StyledCancelButton
                type="button"
                label="Abbrechen"
                onClick={() => {
                  cancelCardPayment()
                }}
              />
            </>
          ) : method === 'checkout' ? (
            <>
              <>
                <InstructionMessage>Bitte warten, Sie werden in wenigen Sekunden weitergeleitet...</InstructionMessage>
              </>
            </>
          ) : null
        ) : (<>
            <InstructionMessage>Bitte wählen Sie eine Zahlungsart:</InstructionMessage>
            <SelectContainer>
              <SingleSelect
                items={PAYMENT_METHODS
                  .filter(method => enabledPaymentMethods.includes(method.value))
                  .map(method => method.value === 'invoice' ? ({
                    ...method,
                    label: `${method.ctaLabel ||method.label} (${invoiceRecipientName})`
                  }) : {
                    ...method,
                    label: method.ctaLabel || method.label
                  })}
                orientation="vertical"
                onChange={e => setMethod(e.target.value)}
                value={method}
              />
            </SelectContainer>
            <StyledNextButton
              type="submit"
              label="Weiter"
              icon="navigate_next"
              onClick={() => this.confirmMethod(method)}
              dataCy="next-button"
              primary
              disabled={!method}
            />
          </>
        )}
      </Container>
    )
  }
}

PaymentMethod.propTypes = {
  itemKey: PropTypes.string.isRequired,
  step: PropTypes.string.isRequired,
  method: PropTypes.string,
  amount: PropTypes.number.isRequired,
  email: PropTypes.string.isRequired,
  immatriculation: PropTypes.string.isRequired,
  landings: PropTypes.number.isRequired,
  landingFeeSingle: PropTypes.number,
  landingFeeCode: PropTypes.string,
  landingFeeTotal: PropTypes.number,
  goArounds: PropTypes.number,
  goAroundFeeSingle: PropTypes.number,
  goAroundFeeCoe: PropTypes.string,
  goAroundFeeTotal: PropTypes.number,
  failure: PropTypes.bool.isRequired,
  enabledPaymentMethods: PropTypes.arrayOf(PropTypes.string).isRequired,
  createMovementFromMovement: PropTypes.func.isRequired,
  finish: PropTypes.func.isRequired,
  setMethod: PropTypes.func.isRequired,
  setStep: PropTypes.func.isRequired,
  cancelCardPayment: PropTypes.func.isRequired,
  saveMovementPaymentMethod: PropTypes.func.isRequired
}

export default withRouter(PaymentMethod)
